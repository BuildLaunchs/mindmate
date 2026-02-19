import os 
import uuid
import datetime
from datetime import timezone
import sqlite3
import random # Added for simulation

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import google.generativeai as genai
from werkzeug.security import generate_password_hash, check_password_hash

# --------------------------------------------------
#                App Setup
# --------------------------------------------------
app = Flask(__name__)
CORS(app)
load_dotenv()

# --------------------------------------------------
#               MongoDB Setup
# --------------------------------------------------
messages_collection = None
users_collection = None
p2p_messages_collection = None
friend_requests_collection = None
# New Collections for Group Chat
groups_collection = None
group_messages_collection = None

try:
    mongo_uri = os.getenv("MONGO_URI")
    if mongo_uri:
        client = MongoClient(mongo_uri)
        db = client["aura_ai"]
        messages_collection = db["messages"] # AI Chat
        users_collection = db["users"]#user profiles 
        p2p_messages_collection = db["p2p_messages"] # User-to-User Chat
        friend_requests_collection = db["friend_requests"] # Friend Requests
        
        # --- NEW GROUP COLLECTIONS ---
        groups_collection = db["groups"] 
        group_messages_collection = db["group_messages"]
        
        print("✅ MongoDB connected")
    else:
        print("⚠️ MONGO_URI not found in environment variables")
except Exception as e:
    print("❌ MongoDB error:", e)

# --------------------------------------------------
#               Gemini Setup
# --------------------------------------------------
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --------------------------------------------------
#           SQLite (AI MEMORY ONLY)
# --------------------------------------------------
def get_sqlite_connection():
    conn = sqlite3.connect("aura_memory.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_memory_db():
    conn = get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            memory_key TEXT,
            memory_value TEXT,
            importance INTEGER,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_memory_db()

# --------------------------------------------------
#               Memory Helpers
# --------------------------------------------------
def get_user_memory(user_id, limit=5):
    conn = get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT memory_key, memory_value
        FROM user_memory
        WHERE user_id = ?
        ORDER BY importance DESC, updated_at DESC
        LIMIT ?
    """, (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return {row["memory_key"]: row["memory_value"] for row in rows}

def save_or_update_memory(user_id, key, value, importance=5):
    conn = get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM user_memory WHERE user_id = ? AND memory_key = ?", (user_id, key))
    existing = cursor.fetchone()
    if existing:
        cursor.execute("UPDATE user_memory SET memory_value = ?, importance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (value, importance, existing["id"]))
    else:
        cursor.execute("INSERT INTO user_memory (user_id, memory_key, memory_value, importance) VALUES (?, ?, ?, ?)", (user_id, key, value, importance))
    conn.commit()
    conn.close()

# --------------------------------------------------
#               AI Persona
# --------------------------------------------------
def get_ai_persona(user_memory):
    memory_block = ""
    for k, v in user_memory.items():
        memory_block += f"- {k}: {v}\n"
    return (
        "You are Aura AI, a compassionate and supportive mental health assistant created by the MindMate team. "
        "You understand Indian cultural values. Always respond calmly, gently, and empathetically.\n\n"
        "Visual Context Instructions:\n"
        "- If you receive a system note that the user looks 'Happy', reply enthusiastically: 'Yes you are looking too much happy today! What is the good news?'\n"
        "- If you receive a system note that the user looks 'Sad', reply gently: 'Ohh dear do not getting sad, I am here, share with your feeling.'\n\n"
        "User background:\n" + memory_block
    )

def get_chat_history(session_id, user_id):
    if messages_collection is None: return []
    cursor = messages_collection.find({"session_id": session_id, "user_id": user_id}).sort("timestamp", 1)
    history = []
    for doc in cursor:
        role = "user" if doc["sender"] == "user" else "model"
        history.append({"role": role, "parts": [doc["message"]]})
    return history
    
# --------------------------------------------------
#               AUTH ROUTES
# --------------------------------------------------
@app.route("/signup", methods=["POST"])
def signup():
    if users_collection is None: return jsonify({"error": "Database not connected"}), 500
    data = request.json
    email = data.get("email")
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409
    
    user_data = {
        "user_id": str(uuid.uuid4()),
        "firstName": data.get("firstName"),
        "lastName": data.get("lastName"),
        "email": email,
        "age": data.get("age"),
        "contactNumber": data.get("contactNumber"),
        "emergencyContact": data.get("emergencyContact"),
        "role": data.get("role", "user"),
        "password": generate_password_hash(data.get("password")),
        "created_at": datetime.datetime.now(timezone.utc),
        "friends": [] 
    }
    users_collection.insert_one(user_data)
    return jsonify({"message": "User created", "success": True}), 201

@app.route("/login", methods=["POST"])
def login():
    if users_collection is None: return jsonify({"error": "Database not connected"}), 500
    data = request.json
    user = users_collection.find_one({"email": data.get("email")})
    if not user or not check_password_hash(user["password"], data.get("password")):
        return jsonify({"error": "Invalid credentials"}), 401
    
    return jsonify({
        "success": True,
        "user": {
            "user_id": user["user_id"],
            "firstName": user["firstName"],
            "email": user["email"],
            "role": user["role"]
        }
    }), 200

# --------------------------------------------------
#           PROFILE MANAGEMENT ROUTES 
# --------------------------------------------------
@app.route("/users/<user_id>", methods=["GET"])
def get_user_profile(user_id):
    if users_collection is None: return jsonify({"error": "DB error"}), 500
    user = users_collection.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    if user:
        return jsonify(user)
    return jsonify({"error": "User not found"}), 404

@app.route("/users/update", methods=["PUT"])
def update_user_profile():
    if users_collection is None: return jsonify({"error": "DB error"}), 500
    data = request.json
    user_id = data.get("user_id")
    
    if not user_id: return jsonify({"error": "User ID required"}), 400

    update_data = {
        "firstName": data.get("firstName"),
        "lastName": data.get("lastName"),
        "age": data.get("age"),
        "contactNumber": data.get("contactNumber"),
        "emergencyContact": data.get("emergencyContact")
    }
    update_data = {k: v for k, v in update_data.items() if v is not None}

    result = users_collection.update_one({"user_id": user_id}, {"$set": update_data})
    
    if result.matched_count > 0:
        updated_user = users_collection.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
        return jsonify({"success": True, "message": "Profile updated", "user": updated_user})
    
    return jsonify({"error": "User not found"}), 404

# --------------------------------------------------
#               FRIEND SYSTEM ROUTES
# --------------------------------------------------
@app.route("/users/search", methods=["POST"])
def search_users():
    if users_collection is None: return jsonify([])
    data = request.json
    query = data.get("query", "").strip()
    current_user_id = data.get("user_id")

    if not query: return jsonify([])

    regex = {"$regex": query, "$options": "i"}
    
    users = list(users_collection.find(
        {
            "$and": [
                {"user_id": {"$ne": current_user_id}},
                {"$or": [{"email": regex}, {"firstName": regex}, {"lastName": regex}]}
            ]
        },
        {"_id": 0, "user_id": 1, "firstName": 1, "lastName": 1, "email": 1, "friends": 1}
    ))

    current_user = users_collection.find_one({"user_id": current_user_id})
    my_friends = current_user.get("friends", []) if current_user else []

    results = []
    for u in users:
        status = "none"
        if u["user_id"] in my_friends:
            status = "friend"
        else:
            pending = friend_requests_collection.find_one({
                "$or": [
                    {"sender_id": current_user_id, "receiver_id": u["user_id"], "status": "pending"},
                    {"sender_id": u["user_id"], "receiver_id": current_user_id, "status": "pending"}
                ]
            })
            if pending:
                status = "pending"
        
        results.append({
            "user_id": u["user_id"],
            "name": f"{u.get('firstName', '')} {u.get('lastName', '')}".strip(),
            "email": u["email"],
            "status": status
        })

    return jsonify(results)

@app.route("/friend-request/send", methods=["POST"])
def send_friend_request():
    if friend_requests_collection is None: return jsonify({"error": "DB error"}), 500
    data = request.json
    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")

    sender = users_collection.find_one({"user_id": sender_id})
    if receiver_id in sender.get("friends", []):
        return jsonify({"error": "Already friends"}), 400

    existing = friend_requests_collection.find_one({
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "status": "pending"
    })
    if existing:
        return jsonify({"error": "Request already sent"}), 400

    friend_requests_collection.insert_one({
        "request_id": str(uuid.uuid4()),
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "status": "pending",
        "timestamp": datetime.datetime.now(timezone.utc)
    })
    return jsonify({"success": True, "message": "Friend request sent"})

@app.route("/friend-request/pending/<user_id>", methods=["GET"])
def get_pending_requests(user_id):
    if friend_requests_collection is None: return jsonify([])
    
    requests = list(friend_requests_collection.find({
        "receiver_id": user_id,
        "status": "pending"
    }))

    results = []
    for req in requests:
        sender = users_collection.find_one({"user_id": req["sender_id"]})
        if sender:
            results.append({
                "request_id": req["request_id"],
                "sender_id": sender["user_id"],
                "sender_name": f"{sender.get('firstName')} {sender.get('lastName')}",
                "sender_email": sender["email"]
            })
    return jsonify(results)

@app.route("/friend-request/accept", methods=["POST"])
def accept_friend_request():
    if users_collection is None: return jsonify({"error": "DB error"}), 500
    data = request.json
    request_id = data.get("request_id")
    
    req = friend_requests_collection.find_one({"request_id": request_id})
    if not req: return jsonify({"error": "Request not found"}), 404

    friend_requests_collection.update_one({"request_id": request_id}, {"$set": {"status": "accepted"}})

    users_collection.update_one({"user_id": req["sender_id"]}, {"$push": {"friends": req["receiver_id"]}})
    users_collection.update_one({"user_id": req["receiver_id"]}, {"$push": {"friends": req["sender_id"]}})

    return jsonify({"success": True, "message": "Friend request accepted"})

@app.route("/friends/list/<user_id>", methods=["GET"])
def get_friends_list(user_id):
    if users_collection is None: return jsonify([])
    
    user = users_collection.find_one({"user_id": user_id})
    if not user: return jsonify([])

    friend_ids = user.get("friends", [])
    if not friend_ids: return jsonify([])

    friends = list(users_collection.find(
        {"user_id": {"$in": friend_ids}},
        {"_id": 0, "user_id": 1, "firstName": 1, "lastName": 1, "email": 1}
    ))

    results = []
    for f in friends:
        results.append({
            "id": f["user_id"],
            "name": f"{f.get('firstName')} {f.get('lastName')}",
            "email": f["email"]
        })
    return jsonify(results)

# --------------------------------------------------
#              GROUP CHAT ROUTES (NEW)
# --------------------------------------------------

@app.route("/groups/create", methods=["POST"])
def create_group():
    if groups_collection is None: return jsonify({"error": "DB error"}), 500
    data = request.json
    group_name = data.get("name")
    creator_id = data.get("creator_id")
    members = data.get("members", []) # List of user IDs including creator

    if not group_name or not creator_id:
        return jsonify({"error": "Missing fields"}), 400

    # Ensure creator is in members
    if creator_id not in members:
        members.append(creator_id)

    group_data = {
        "group_id": str(uuid.uuid4()),
        "name": group_name,
        "created_by": creator_id,
        "members": members,
        "created_at": datetime.datetime.now(timezone.utc)
    }

    groups_collection.insert_one(group_data)
    return jsonify({"success": True, "message": "Group created", "group": {"id": group_data["group_id"], "name": group_data["name"]}})

@app.route("/groups/list/<user_id>", methods=["GET"])
def list_groups(user_id):
    if groups_collection is None: return jsonify([])
    
    # Find groups where user_id is in members array
    groups = list(groups_collection.find(
        {"members": user_id},
        {"_id": 0, "group_id": 1, "name": 1, "members": 1}
    ))
    
    results = []
    for g in groups:
        results.append({
            "id": g["group_id"],
            "name": g["name"],
            "member_count": len(g["members"])
        })
    
    return jsonify(results)

@app.route("/groups/messages/<group_id>", methods=["GET"])
def get_group_messages(group_id):
    if group_messages_collection is None: return jsonify([])
    
    messages = list(group_messages_collection.find(
        {"group_id": group_id}, 
        {"_id": 0}
    ).sort("timestamp", 1))

    return jsonify(messages)

@app.route("/groups/send", methods=["POST"])
def send_group_message():
    if group_messages_collection is None: return jsonify({"error": "DB error"}), 500
    data = request.json
    sender_id = data.get("sender_id")
    
    # Fetch sender name for display purposes in group chat
    sender = users_collection.find_one({"user_id": sender_id})
    sender_name = f"{sender.get('firstName')} {sender.get('lastName')}" if sender else "Unknown"

    msg_data = {
        "message_id": str(uuid.uuid4()),
        "group_id": data.get("group_id"),
        "sender_id": sender_id,
        "sender_name": sender_name,
        "text": data.get("text"),
        "timestamp": datetime.datetime.now(timezone.utc).isoformat()
    }

    group_messages_collection.insert_one(msg_data)
    return jsonify({"success": True, "message": msg_data})


# --------------------------------------------------
#              P2P CHAT ROUTES
# --------------------------------------------------
@app.route("/p2p/messages", methods=["POST"])
def get_p2p_messages():
    if p2p_messages_collection is None: return jsonify([])
    data = request.json
    user_id = data.get("user_id")
    friend_id = data.get("friend_id")

    messages = list(p2p_messages_collection.find({
        "$or": [
            {"sender_id": user_id, "receiver_id": friend_id},
            {"sender_id": friend_id, "receiver_id": user_id}
        ]
    }, {"_id": 0}).sort("timestamp", 1))

    return jsonify(messages)

@app.route("/p2p/send", methods=["POST"])
def send_p2p_message():
    if p2p_messages_collection is None: return jsonify({"error": "DB error"}), 500
    data = request.json
    
    msg_data = {
        "message_id": str(uuid.uuid4()),
        "sender_id": data.get("sender_id"),
        "receiver_id": data.get("receiver_id"),
        "text": data.get("text"),
        "timestamp": datetime.datetime.now(timezone.utc).isoformat(),
        "read": False
    }

    p2p_messages_collection.insert_one(msg_data)
    return jsonify({"success": True, "message": msg_data})

# --------------------------------------------------
#           EMOTION DETECTION (SIMULATED)
# --------------------------------------------------

@app.route("/detect_emotion", methods=["POST"])
def detect_emotion():
    
    try:
        data = request.json
       
        emotions = ['happy', 'sad', 'neutral', 'neutral', 'neutral']
        detected = random.choice(emotions) 
        confidence = random.uniform(60.0, 95.0)

        return jsonify({
            "status": "success",
            "top_emotion": detected,
            "confidence": confidence
        })
    except Exception as e:
        print("Emotion Error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

# --------------------------------------------------
#             AI CHAT ROUTES 
# --------------------------------------------------
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json or {}
    user_message = data.get("message")
    user_id = data.get("user_id", "user_1")
    session_id = data.get("session_id") or str(uuid.uuid4())
    emotion = data.get("emotion") # NEW: Get emotion from frontend

    if not user_message: return jsonify({"error": "No message"}), 400

    # Store User Message
    if messages_collection is not None:
        messages_collection.insert_one({
            "user_id": user_id, "session_id": session_id,
            "sender": "user", "message": user_message,
            "timestamp": datetime.datetime.now(timezone.utc)
        })

    user_memory = get_user_memory(user_id)
    history = get_chat_history(session_id, user_id)
    
    # NEW: Prepare Context Message for AI
    # If the user looks happy/sad in video, we prepend this context to the message
    context_message = user_message
    if emotion and emotion != "neutral":
        # The frontend sends a specific prompt if triggering proactive reaction,
        # but for normal chat, we just add context.
        if "[SYSTEM:" not in user_message:
            context_message = f"[Visual Context: The user looks {emotion}] {user_message}"
    
    model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=get_ai_persona(user_memory))
    chat_session = model.start_chat(history=history)
    
    # Send the context-enriched message to Gemini
    response = chat_session.send_message(context_message)
    
    # Store AI Response
    if messages_collection is not None:
        messages_collection.insert_one({
            "user_id": user_id, "session_id": session_id,
            "sender": "ai", "message": response.text,
            "timestamp": datetime.datetime.now(timezone.utc)
        })

    return jsonify({"reply": response.text, "session_id": session_id})

@app.route("/sessions/<user_id>", methods=["GET"])
def get_sessions(user_id):
    if messages_collection is None: return jsonify([])
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$sort": {"timestamp": -1}},
        {"$group": {"_id": "$session_id", "last_message": {"$first": "$message"}, "timestamp": {"$first": "$timestamp"}}},
        {"$sort": {"timestamp": -1}}
    ]
    sessions = list(messages_collection.aggregate(pipeline))
    return jsonify([{"session_id": s["_id"], "preview": s["last_message"][:30] + "...", "timestamp": s["timestamp"]} for s in sessions])
#--------------------------------------------------
#               Session Management Routes
# --------------------------------------------------
@app.route("/sessions/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    if messages_collection is not None:
        messages_collection.delete_many({"session_id": session_id})
        return jsonify({"success": True})
    return jsonify({"error": "DB error"}), 500

@app.route("/history/<session_id>", methods=["GET"])
def get_session_history(session_id):
    if messages_collection is None: return jsonify([])
    return jsonify(list(messages_collection.find({"session_id": session_id}, {"_id": 0}).sort("timestamp", 1)))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)