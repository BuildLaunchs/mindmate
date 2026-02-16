import os
import uuid
import datetime
from datetime import timezone
import sqlite3

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import google.generativeai as genai
from werkzeug.security import generate_password_hash, check_password_hash

# --------------------------------------------------
# App Setup
# --------------------------------------------------
app = Flask(__name__)
CORS(app)
load_dotenv()

# --------------------------------------------------
# MongoDB Setup (Chat History & Users)
# --------------------------------------------------
messages_collection = None
users_collection = None

try:
    mongo_uri = os.getenv("MONGO_URI")
    if mongo_uri:
        client = MongoClient(mongo_uri)
        db = client["aura_ai"]
        messages_collection = db["messages"]
        users_collection = db["users"]
        print("✅ MongoDB connected")
    else:
        print("⚠️ MONGO_URI not found in environment variables")
except Exception as e:
    print("❌ MongoDB error:", e)
    messages_collection = None
    users_collection = None

# --------------------------------------------------
# Gemini Setup
# --------------------------------------------------
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --------------------------------------------------
# SQLite (AI MEMORY ONLY)
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
# Memory Helpers
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

    cursor.execute("""
        SELECT id FROM user_memory
        WHERE user_id = ? AND memory_key = ?
    """, (user_id, key))
    existing = cursor.fetchone()

    if existing is not None:
        cursor.execute("""
            UPDATE user_memory
            SET memory_value = ?, importance = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (value, importance, existing["id"]))
    else:
        cursor.execute("""
            INSERT INTO user_memory (user_id, memory_key, memory_value, importance)
            VALUES (?, ?, ?, ?)
        """, (user_id, key, value, importance))

    conn.commit()
    conn.close()

# --------------------------------------------------
# AI Persona (WITH MEMORY)
# --------------------------------------------------
def get_ai_persona(user_memory):
    memory_block = ""
    for k, v in user_memory.items():
        memory_block += f"- {k}: {v}\n"

    return (
        "You are Aura AI, a compassionate and supportive mental health assistant "
        "created by the MindMate team. "
        "You understand Indian cultural values. "
        "Always respond calmly, gently, and empathetically. "
        "Never mention memory, databases, or internal systems.\n\n"
        "User background (use naturally):\n"
        f"{memory_block}"
    )

# --------------------------------------------------
# Load Chat History (MongoDB)
# --------------------------------------------------
def get_chat_history(session_id, user_id):
    if messages_collection is None:
        return []

    cursor = messages_collection.find(
        {"session_id": session_id, "user_id": user_id}
    ).sort("timestamp", 1)

    history = []
    for doc in cursor:
        role = "user" if doc["sender"] == "user" else "model"
        history.append({"role": role, "parts": [doc["message"]]})

    return history

# --------------------------------------------------
# AUTH ROUTES (Sign Up, Login, Reset Password)
# --------------------------------------------------

@app.route("/signup", methods=["POST"])
def signup():
    if users_collection is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    # Check if user exists
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    # Hash password
    hashed_password = generate_password_hash(password)
    
    user_data = {
        "user_id": str(uuid.uuid4()),
        "firstName": data.get("firstName"),
        "lastName": data.get("lastName"),
        "email": email,
        "age": data.get("age"),
        "role": data.get("role", "user"),
        "contactNumber": data.get("contactNumber"),
        "emergencyContact": data.get("emergencyContact"),
        "password": hashed_password,
        "created_at": datetime.datetime.now(timezone.utc)
    }

    users_collection.insert_one(user_data)
    
    return jsonify({"message": "User created successfully", "success": True}), 201

@app.route("/login", methods=["POST"])
def login():
    if users_collection is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.json
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    user = users_collection.find_one({"email": email})

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401
    
    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid email or password"}), 401
        
    if role and user.get("role") != role:
        return jsonify({"error": f"Access denied. You are not a {role}."}), 403

    # Return user info (excluding password)
    return jsonify({
        "success": True,
        "user": {
            "user_id": user["user_id"],
            "name": f"{user['firstName']} {user['lastName']}",
            "firstName": user["firstName"],
            "email": user["email"],
            "role": user["role"],
            "loginTime": datetime.datetime.now().isoformat()
        }
    }), 200

@app.route("/reset-password", methods=["POST"])
def reset_password():
    if users_collection is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.json
    email = data.get("email")
    new_password = data.get("new_password")

    if not email or not new_password:
         return jsonify({"error": "Email and new password are required"}), 400

    # Find user by email
    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "User with this email does not exist"}), 404

    # Hash new password
    hashed_password = generate_password_hash(new_password)
    
    # Update password
    users_collection.update_one(
        {"email": email},
        {"$set": {"password": hashed_password}}
    )

    return jsonify({"message": "Password updated successfully", "success": True}), 200

# --------------------------------------------------
# CHAT API
# --------------------------------------------------
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json or {}
    user_message = data.get("message")
    user_id = data.get("user_id", "user_1")
    session_id = data.get("session_id") or str(uuid.uuid4())

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        now = datetime.datetime.now(timezone.utc)

        # Save user message
        if messages_collection is not None:
            messages_collection.insert_one({
                "user_id": user_id,
                "session_id": session_id,
                "sender": "user",
                "message": user_message,
                "timestamp": now
            })

        # 🧠 Load AI Memory
        user_memory = get_user_memory(user_id)

        msg_lower = user_message.lower()

        # Simple learning rules
        if "my name is" in msg_lower:
            name = user_message.split("is")[-1].strip()
            save_or_update_memory(user_id, "name", name, importance=10)

        if "exam" in msg_lower and "stress" in msg_lower:
            save_or_update_memory(user_id, "stress_trigger", "exams", importance=9)

        # Load history
        history = get_chat_history(session_id, user_id)

        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=get_ai_persona(user_memory)
        )

        chat_session = model.start_chat(history=history)
        response = chat_session.send_message(user_message)
        ai_reply = response.text

        # Save AI reply
        if messages_collection is not None:
            messages_collection.insert_one({
                "user_id": user_id,
                "session_id": session_id,
                "sender": "ai",
                "message": ai_reply,
                "timestamp": datetime.datetime.now(timezone.utc)
            })

        return jsonify({
            "reply": ai_reply,
            "session_id": session_id
        })

    except Exception as e:
        print("❌ Chat error:", e)
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# SESSIONS LIST & DELETE
# --------------------------------------------------
@app.route("/sessions/<user_id>", methods=["GET"])
def get_sessions(user_id):
    if messages_collection is None:
        return jsonify([])

    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$sort": {"timestamp": -1}},
        {"$group": {
            "_id": "$session_id",
            "last_message": {"$first": "$message"},
            "timestamp": {"$first": "$timestamp"}
        }},
        {"$sort": {"timestamp": -1}}
    ]

    sessions = list(messages_collection.aggregate(pipeline))

    return jsonify([
        {
            "session_id": s["_id"],
            "preview": s["last_message"][:30] + "...",
            "timestamp": s["timestamp"]
        }
        for s in sessions
    ])

@app.route("/sessions/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    if messages_collection is None:
        return jsonify({"error": "Database not connected"}), 500

    # Delete all messages with this session_id
    result = messages_collection.delete_many({"session_id": session_id})
    
    if result.deleted_count > 0:
        return jsonify({"success": True, "message": "Session deleted"}), 200
    else:
        return jsonify({"error": "Session not found"}), 404

# --------------------------------------------------
# SESSION HISTORY
# --------------------------------------------------
@app.route("/history/<session_id>", methods=["GET"])
def get_session_history(session_id):
    if messages_collection is None:
        return jsonify([])

    messages = list(messages_collection.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", 1))

    return jsonify(messages)

# --------------------------------------------------
# RUN
# --------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)