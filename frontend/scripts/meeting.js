// meeting.js – Full version with time-based waiting system

let meetingTimerInterval;
let meetingSeconds = 0;
let isChatOpen = false;
let meetingStarted = false;

document.addEventListener('DOMContentLoaded', () => {
    // Init icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Read URL params
    const params = new URLSearchParams(window.location.search);
    const counselor = params.get('counselor') || "Dr. Rohan Verma";
    const sessionDatetime = params.get('datetime');

    // Set counselor name
    document.getElementById('counselor-name').textContent =
        decodeURIComponent(counselor);

    // Set initials
    const initials = counselor
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    document.getElementById('counselor-initials').textContent = initials;

    // If no datetime found → start meeting directly
    if (!sessionDatetime) {
        startMeeting();
        return;
    }

    const sessionTime = new Date(sessionDatetime);

    // Show session time in waiting overlay
    const timeEl = document.getElementById('session-time-text');
    if (timeEl) {
        timeEl.textContent = sessionTime.toLocaleString();
    }

    checkMeetingTime(sessionTime);

    // Chat input enter key
    const msgInput = document.getElementById('msg-input');
    if (msgInput) {
        msgInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }
});

/* ----------------------------------
   WAITING / TIME CHECK LOGIC
----------------------------------- */

function checkMeetingTime(sessionTime) {
    const overlay = document.getElementById('waiting-overlay');

    const timer = setInterval(() => {
        const now = new Date();

        if (now >= sessionTime) {
            clearInterval(timer);
            if (overlay) overlay.style.display = 'none';
            startMeeting();
        }
    }, 1000);
}

/* ----------------------------------
   MEETING START
----------------------------------- */

function startMeeting() {
    if (meetingStarted) return;
    meetingStarted = true;

    startMeetingTimer();
    simulateConnectionFlow();
}

/* ----------------------------------
   TIMER
----------------------------------- */

function startMeetingTimer() {
    const timerElement = document.getElementById('meeting-timer');
    meetingSeconds = 0;

    meetingTimerInterval = setInterval(() => {
        meetingSeconds++;
        const minutes = Math.floor(meetingSeconds / 60);
        const seconds = meetingSeconds % 60;

        timerElement.textContent =
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

/* ----------------------------------
   CONNECTION SIMULATION
----------------------------------- */

function simulateConnectionFlow() {
    const statusEl = document.getElementById('counselor-status');
    const pulses = document.querySelectorAll('.audio-pulse');

    statusEl.textContent = "Connecting...";
    pulses.forEach(p => p.style.animation = 'none');

    setTimeout(() => {
        statusEl.textContent = "Connected";
        showToast("Host joined the meeting", "success");

        setTimeout(() => {
            statusEl.textContent = "Speaking...";
            pulses.forEach(p => p.style.animation = '');

            setTimeout(() => {
                receiveChatMessage("Hello! Thanks for joining on time 😊");
            }, 2000);

        }, 1500);

    }, 1500);
}

/* ----------------------------------
   GUARD (BLOCK ACTIONS BEFORE START)
----------------------------------- */

function guardMeetingStart() {
    if (!meetingStarted) {
        showToast("Host will join soon. Please wait.", "error");
        return false;
    }
    return true;
}

/* ----------------------------------
   CONTROLS
----------------------------------- */

function toggleMute(btn) {
    if (!guardMeetingStart()) return;

    const icon = btn.querySelector('i');
    const muted = btn.classList.toggle('active-off');

    icon.setAttribute('data-lucide', muted ? 'mic-off' : 'mic');
    showToast(muted ? "Microphone muted" : "Microphone unmuted");
    lucide.createIcons();
}

function toggleCamera(btn) {
    if (!guardMeetingStart()) return;

    const icon = btn.querySelector('i');
    const off = btn.classList.toggle('active-off');
    const indicator = document.getElementById('camera-off-indicator');

    icon.setAttribute('data-lucide', off ? 'video-off' : 'video');

    if (indicator) indicator.classList.toggle('hidden', !off);

    showToast(off ? "Camera off" : "Camera on");
    lucide.createIcons();
}

function toggleChat() {
    if (!guardMeetingStart()) return;

    const panel = document.getElementById('side-panel');
    const stage = document.getElementById('stage-container');
    const dot = document.getElementById('chat-dot');

    isChatOpen = !isChatOpen;

    panel.classList.toggle('open', isChatOpen);
    stage.classList.toggle('chat-open', isChatOpen);

    if (dot) dot.classList.add('hidden');
}

/* ----------------------------------
   CHAT
----------------------------------- */

function sendChatMessage() {
    if (!guardMeetingStart()) return;

    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'me');
    input.value = '';
}

function receiveChatMessage(text) {
    addMessage(text, 'them');

    if (!isChatOpen) {
        const dot = document.getElementById('chat-dot');
        if (dot) dot.classList.remove('hidden');
    }
}

function addMessage(text, sender) {
    const feed = document.getElementById('chat-feed');
    if (!feed) return;

    const div = document.createElement('div');
    div.className = `chat-msg ${sender}`;
    div.textContent = text;

    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
}

/* ----------------------------------
   END MEETING
----------------------------------- */

function endMeeting() {
    if (!confirm("Leave this meeting?")) return;

    clearInterval(meetingTimerInterval);
    showToast("Meeting ended", "success");

    document.body.style.opacity = "0";
    setTimeout(() => {
        window.location.href = "user-dashboard.html";
    }, 800);
}







function checkMeetingTime(sessionTime) {
    const overlay = document.getElementById('waiting-overlay');
    const countdownEl = document.getElementById('countdown-timer');

    const interval = setInterval(() => {
        const now = new Date();
        const diff = sessionTime - now;

        // Time reached → start meeting
        if (diff <= 0) {
            clearInterval(interval);
            if (overlay) overlay.style.display = 'none';
            startMeeting();
            return;
        }

        // Countdown calculation
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (countdownEl) {
            countdownEl.textContent =
                `${String(hours).padStart(2,'0')}:` +
                `${String(minutes).padStart(2,'0')}:` +
                `${String(seconds).padStart(2,'0')}`;
        }
    }, 1000);
}

function goToDashboard() {
    if (meetingStarted) {
        showToast("Meeting already started", "error");
        return;
    }

    window.location.href = "user-dashboard.html";
}
