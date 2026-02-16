// User dashboard functionality

// --- Global Variables ---
let selectedMood = null;
let callTimerInterval = null;
let callStartTime = null;
let upcomingSessions = [];
let bookingDate = new Date();
let selectedBookingDate = null;
let selectedBookingTime = null;
let chatMessages = [];
let currentQuestionIndex = 0;
let userAnswers = [];


// --- START: Theme Customization ---
function initializeTheme() {
    const themeSettingsBtn = document.getElementById('theme-settings-btn');
    const themePopover = document.getElementById('theme-popover');
    const themeToggle = document.getElementById('theme-mode-toggle');
    const accentColorPicker = document.getElementById('accent-color-picker');

    if (!themeSettingsBtn || !themePopover || !themeToggle || !accentColorPicker) return;

    // Load saved settings from localStorage
    const savedTheme = getFromStorage('userTheme') || { mode: 'light', accentHue: '238' };
    applyTheme(savedTheme);

    // --- Event Listeners ---

    // Toggle popover visibility
    themeSettingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        themePopover.classList.toggle('hidden');
    });

    // Close popover if clicked outside
    document.addEventListener('click', (e) => {
        if (!themePopover.contains(e.target) && !themeSettingsBtn.contains(e.target)) {
            themePopover.classList.add('hidden');
        }
    });

    // Handle theme mode change
    themeToggle.addEventListener('change', () => {
        const mode = themeToggle.checked ? 'dark' : 'light';
        const currentHue = document.documentElement.dataset.accentHue || '238';
        saveAndApplyTheme({ mode, accentHue: currentHue });
    });

    // Handle accent color change
    accentColorPicker.addEventListener('click', (e) => {
        const button = e.target.closest('.color-swatch');
        if (button) {
            const hue = button.dataset.colorHue;
            const currentMode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            saveAndApplyTheme({ mode: currentMode, accentHue: hue });
        }
    });

    // --- Core Functions ---

    function applyTheme({ mode, accentHue }) {
        // Apply light/dark mode
        document.documentElement.classList.toggle('dark', mode === 'dark');
        if (themeToggle) themeToggle.checked = mode === 'dark';

        // Apply accent color using HSL hue value
        const newPrimary = `hsl(${accentHue}, 57%, 58%)`;
        const newPrimaryGlow = `hsl(${accentHue}, 57%, 70%)`;
        document.documentElement.style.setProperty('--primary', newPrimary);
        document.documentElement.style.setProperty('--primary-glow', newPrimaryGlow);
        document.documentElement.style.setProperty('--ring', newPrimary);

        // Update selected state on swatches
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.toggle('selected', swatch.dataset.colorHue === accentHue);
        });
        
        document.documentElement.dataset.accentHue = accentHue;
    }

    function saveAndApplyTheme(theme) {
        applyTheme(theme);
        saveToStorage('userTheme', theme);
        // Re-render icons in case their color is based on a CSS variable like --primary
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}
// --- END: Theme Customization ---


// --- Core Dashboard & Initialization ---

document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme first to prevent flash of wrong colors
  initializeTheme();

  // Check for a logged-in user; redirect if not found
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'user') {
    showToast('Access denied. Please log in.', 'error');
    setTimeout(() => navigateTo('login.html'), 2000);
    return;
  }
  
  // Initialize all dashboard components
  updateWelcomeMessage(currentUser);
  loadWellnessProfile();
  animateProgressBars();
  loadRecentActivities();
  initializeMoodSelector();
  checkQuestionnaireStatus();
  loadAndRenderUpcomingSessions();
});

function updateWelcomeMessage(user) {
  const welcomeElement = document.querySelector('header h1');
  if (welcomeElement && user.firstName) {
    welcomeElement.textContent = `Welcome back, ${user.firstName}!`;
  }
}

function animateProgressBars() {
  document.querySelectorAll('.progress-bar').forEach(bar => {
    const width = bar.style.width;
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.transition = 'width 1s ease-out';
      bar.style.width = width;
    }, 300);
  });
}


// --- Wellness Score Calculation and UI Updates ---

function animateCountUp(element, to) {
  let from = parseInt(element.textContent);
  if (isNaN(from)) from = 0;
  if (from === to) return;

  const duration = 1500;
  const frameDuration = 1000 / 60;
  const totalFrames = Math.round(duration / frameDuration);
  const countIncrement = (to - from) / totalFrames;

  let currentFrame = 0;
  const counter = setInterval(() => {
    from += countIncrement;
    currentFrame++;

    if (currentFrame === totalFrames) {
      clearInterval(counter);
      element.textContent = to;
    } else {
      element.textContent = Math.round(from);
    }
  }, frameDuration);
}

function updateWellnessJourneyUI(score, animate = false) {
  const scoreElement = document.getElementById('wellness-score');
  const moodProgress = document.getElementById('mood-progress');
  const moodLabel = document.getElementById('mood-progress-label');

  if (scoreElement && moodProgress && moodLabel) {
    if (animate) {
      animateCountUp(scoreElement, score);
    } else {
      scoreElement.textContent = score;
    }
    moodProgress.style.width = `${score}%`;
    moodLabel.textContent = `${score}%`;
  }
}

function loadWellnessProfile() {
  const profile = getFromStorage('wellnessProfile');
  if (profile && typeof profile.score !== 'undefined') {
    updateWellnessJourneyUI(profile.score, false);
  }
}


// --- Recent Activities Logic ---

function addActivity(type, title) {
  let activities = getFromStorage('recentActivities') || [];
  const newActivity = { type, title, time: new Date().toISOString() };
  activities.unshift(newActivity);
  activities = activities.slice(0, 5);
  saveToStorage('recentActivities', activities);
  loadRecentActivities();
}

function loadRecentActivities() {
  const activities = getFromStorage('recentActivities') || [];
  const container = document.getElementById('recent-activities');
  if (!container) return;

  if (activities.length === 0) {
    container.innerHTML = `<p class="text-sm text-muted-foreground text-center py-4">Your recent activities will show up here.</p>`;
    return;
  }
  container.innerHTML = activities.map(activity => `
    <div class="flex items-center gap-4 p-3 rounded-lg bg-muted">
      <div class="p-2 rounded-full ${getActivityIconStyle(activity.type)}"><i data-lucide="${getActivityIcon(activity.type)}" class="w-5 h-5"></i></div>
      <div class="flex-1">
        <div class="font-medium">${activity.title}</div>
        <div class="text-sm text-muted-foreground">${getTimeAgo(activity.time)}</div>
      </div>
    </div>`).join('');
  lucide.createIcons();
}

function getActivityIcon(type) {
  const icons = { chat: 'message-circle', booking: 'calendar-plus', assessment: 'clipboard-check', cancel: 'calendar-x' };
  return icons[type] || 'activity';
}
function getActivityIconStyle(type) {
  const styles = { chat: 'bg-primary/20 text-primary', booking: 'bg-wellness/20 text-wellness', assessment: 'bg-warning/20 text-warning', cancel: 'bg-destructive/20 text-destructive' };
  return styles[type] || 'bg-muted';
}


// --- Quick Actions & Mood Tracking ---
function startAIChat() { openModal('chat-modal'); initializeChat(); }
function startAudioCall() { startCall('audio'); }
function startVideoCall() { startCall('video'); }

function initializeMoodSelector() {
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      selectedMood = this.dataset.mood;
    });
  });
}

function saveMood() {
  if (!selectedMood) { showToast('Please select your mood first.', 'error'); return; }
  showToast('Mood saved successfully! Keep up the great work.', 'success');
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  selectedMood = null;
}


// --- AI Chat & Call Functions ---
function initializeChat() {
  chatMessages = [{ sender: 'ai', message: "Hello! As an AI assistant, I'm here to listen. How can I support you today?" }];
  displayChatMessages();
  const chatInput = document.getElementById('chat-input');
  if(chatInput) chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
}

function displayChatMessages() {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  container.innerHTML = chatMessages.map(msg => `<div class="chat-message-wrapper ${msg.sender === 'user' ? 'user' : 'ai'}"><div class="chat-bubble">${msg.message}</div></div>`).join('');
  container.scrollTop = container.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  if (!input.value.trim()) return;
  chatMessages.push({ sender: 'user', message: input.value });
  input.value = '';
  displayChatMessages();
  setTimeout(() => {
    const aiResponse = "Thank you for sharing that. It takes courage to open up. Could you tell me a little more about what's on your mind?";
    chatMessages.push({ sender: 'ai', message: aiResponse });
    displayChatMessages();
  }, 1200);
}

function closeChat() {
  closeModal('chat-modal');
  showToast('Chat session ended. Your conversation is saved securely.', 'success');
  addActivity('chat', 'Completed an AI Chat session');
}

function startCall(type) {
  const title = document.getElementById('call-title'), status = document.getElementById('call-status'), timer = document.getElementById('call-timer'), audioView = document.getElementById('call-audio-view'), videoView = document.getElementById('call-video-view'), videoControl = document.getElementById('video-control-btn');
  if(!title) return; // Guard clause if elements don't exist

  title.textContent = type === 'audio' ? 'AI Audio Call' : 'AI Video Call';
  audioView.style.display = type === 'audio' ? 'flex' : 'none';
  videoView.style.display = type === 'video' ? 'block' : 'none';
  videoControl.style.display = type === 'video' ? 'flex' : 'none';
  status.textContent = 'Connecting...'; timer.textContent = '00:00';
  if (callTimerInterval) clearInterval(callTimerInterval);
  openModal('call-modal');
  setTimeout(() => {
    status.textContent = 'Connected'; callStartTime = new Date();
    callTimerInterval = setInterval(updateCallTimer, 1000);
  }, 2000);
}

function updateCallTimer() {
  if (!callStartTime) return;
  const now = new Date(), elapsed = Math.floor((now - callStartTime) / 1000), minutes = String(Math.floor(elapsed / 60)).padStart(2, '0'), seconds = String(elapsed % 60).padStart(2, '0');
  const timerEl = document.getElementById('call-timer');
  if(timerEl) timerEl.textContent = `${minutes}:${seconds}`;
}

function endCall() {
  clearInterval(callTimerInterval);
  const timerEl = document.getElementById('call-timer');
  const titleEl = document.getElementById('call-title');
  
  const finalDuration = timerEl ? timerEl.textContent : '00:00';
  const callTitle = titleEl ? titleEl.textContent : 'Call';
  
  closeModal('call-modal');
  showToast(`Call ended. Duration: ${finalDuration}`, 'success');

  if (finalDuration !== '00:00') {
    addActivity('chat', `${callTitle} (${finalDuration})`);
  }

  callTimerInterval = null;
  callStartTime = null;
}

function toggleMute(button) {
  const icon = button.querySelector('i'), isMuted = icon.getAttribute('data-lucide') === 'mic';
  icon.setAttribute('data-lucide', isMuted ? 'mic-off' : 'mic');
  showToast(isMuted ? 'Microphone muted' : 'Microphone unmuted', 'success');
  lucide.createIcons();
}

function toggleCamera(button) {
  const icon = button.querySelector('i'), isVideoOn = icon.getAttribute('data-lucide') === 'video';
  icon.setAttribute('data-lucide', isVideoOn ? 'video-off' : 'video');
  showToast(isVideoOn ? 'Camera off' : 'Camera on', 'success');
  lucide.createIcons();
}


// --- Questionnaire Feature ---
const wellnessQuestions = [
  { question: "Over the last 2 weeks, how often have you had little interest or pleasure in doing things you normally enjoy?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], scores: [0, 1, 2, 3] },
  { question: "How often have you been feeling down, depressed, or hopeless?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], scores: [0, 1, 2, 3] },
  { question: "How often have you had trouble falling asleep, staying asleep, or sleeping too much?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], scores: [0, 1, 2, 3] },
  { question: "How often have you been feeling tired or having little energy?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], scores: [0, 1, 2, 3] },
  { question: "How often have you felt bad about yourself, or that you are a failure, or have let yourself or your family down?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], scores: [0, 1, 2, 3] },
  { question: "Over the last 2 weeks, how often have you been feeling nervous, anxious, or on edge?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], scores: [0, 1, 2, 3] },
  { question: "How often have you been unable to stop or control worrying?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], scores: [0, 1, 2, 3] },
  { question: "How often have you had trouble relaxing?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], scores: [0, 1, 2, 3] },
  { question: "How often have you been so restless that it is hard to sit still?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], scores: [0, 1, 2, 3] },
  { question: "How often have you become easily annoyed or irritable?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], scores: [0, 1, 2, 3] },
  { question: "Over the last 2 weeks, have you been able to concentrate on what you're doing?", options: ["Better than usual", "Same as usual", "Less than usual", "Much less than usual"], scores: [0, 1, 2, 3] },
  { question: "Have you felt that you are playing a useful part in things?", options: ["More so than usual", "Same as usual", "Less so than usual", "Much less than usual"], scores: [0, 1, 2, 3] },
  { question: "Have you felt capable of making decisions about things?", options: ["More so than usual", "Same as usual", "Less able than usual", "Much less able"], scores: [0, 1, 2, 3] },
  { question: "Have you been able to enjoy your normal day-to-day activities?", options: ["More so than usual", "Same as usual", "Less so than usual", "Much less than usual"], scores: [0, 1, 2, 3] },
  { question: "Overall, how connected have you felt to other people?", options: ["Very connected", "Moderately connected", "Slightly connected", "Not at all connected"], scores: [0, 1, 2, 3] }
];

function calculateWellnessScore(answers) {
  let rawScore = 0;
  let maxScore = 0;
  answers.forEach((answer, index) => {
    const question = wellnessQuestions[index];
    const optionIndex = question.options.indexOf(answer);
    if (optionIndex > -1) {
      rawScore += question.scores[optionIndex];
    }
    maxScore += Math.max(...question.scores);
  });
  if (maxScore === 0) return 100;
  const wellnessScore = Math.round((1 - (rawScore / maxScore)) * 100);
  return wellnessScore;
}

function submitQuestionnaire() {
  if (userAnswers.includes(null)) {
    showToast('Please answer all questions.', 'error');
    return;
  }
  closeModal('questionnaire-modal');
  showToast('Thank you for completing your wellness check-in!', 'success');
  addActivity('assessment', 'Completed Wellness Check-in');
  const score = calculateWellnessScore(userAnswers);
  updateWellnessJourneyUI(score, true);
  saveToStorage('wellnessProfile', { score: score, lastUpdate: new Date().toISOString() });
}

function checkQuestionnaireStatus() { const card = document.getElementById('questionnaire-card'); if (card) card.style.display = 'flex'; }
function startQuestionnaire() {
  currentQuestionIndex = 0; userAnswers = new Array(wellnessQuestions.length).fill(null);
  displayQuestion(currentQuestionIndex); openModal('questionnaire-modal');
}

function displayQuestion(index) {
  const questionObj = wellnessQuestions[index];
  document.getElementById('questionnaire-question').textContent = questionObj.question;
  const optionsContainer = document.getElementById('questionnaire-options');
  optionsContainer.innerHTML = questionObj.options.map((option, i) => `
    <div><input type="radio" id="q${index}-option${i}" name="question${index}" value="${option}" class="radio-input" ${userAnswers[index] === option ? 'checked' : ''}>
    <label for="q${index}-option${i}" class="radio-label w-full">${option}</label></div>`).join('');
  document.querySelectorAll(`input[name="question${index}"]`).forEach(input => {
    input.addEventListener('change', () => { userAnswers[index] = input.value; });
  });
  const progress = ((index + 1) / wellnessQuestions.length) * 100;
  document.getElementById('questionnaire-progress-bar').style.width = `${progress}%`;
  document.getElementById('questionnaire-progress-text').textContent = `Question ${index + 1} of ${wellnessQuestions.length}`;
  document.getElementById('q-prev-btn').style.display = index === 0 ? 'none' : 'inline-flex';
  document.getElementById('q-next-btn').style.display = index === wellnessQuestions.length - 1 ? 'none' : 'inline-flex';
  document.getElementById('q-submit-btn').style.display = index === wellnessQuestions.length - 1 ? 'inline-flex' : 'none';
}

function nextQuestion() {
  if (userAnswers[currentQuestionIndex] === null) { showToast('Please select an answer.', 'error'); return; }
  if (currentQuestionIndex < wellnessQuestions.length - 1) { currentQuestionIndex++; displayQuestion(currentQuestionIndex); }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) { currentQuestionIndex--; displayQuestion(currentQuestionIndex); }
}


// --- Session Booking & Display Feature ---

function loadAndRenderUpcomingSessions() {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(14, 0, 0, 0);
  upcomingSessions = getFromStorage('upcomingSessions') || [{ id: 1, counselor: "Dr. Priya Sharma", type: "Cognitive Behavioral Therapy", datetime: tomorrow.toISOString() }];
  renderUpcomingSessions();
}

function renderUpcomingSessions() {
  const container = document.getElementById('upcoming-sessions-list'); 
  if (!container) return;
  
  if (upcomingSessions.length === 0) { 
      container.innerHTML = `<p class="text-sm text-muted-foreground text-center py-4">No upcoming sessions.</p>`; 
      return; 
  }
  
  upcomingSessions.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  
  container.innerHTML = upcomingSessions.map(session => {
    const sessionDate = new Date(session.datetime);
    const dateString = sessionDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const timeString = sessionDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    
    // Encode counselor name for the URL to pass to the meeting page
    const counselorParam = encodeURIComponent(session.counselor);

    return `
      <div class="p-3 border rounded-lg bg-card" style="border-color: var(--border);">
        <div class="flex justify-between items-start">
            <div>
                <div class="font-medium">${session.counselor}</div>
                <div class="text-sm text-muted-foreground">${dateString} at ${timeString}</div>
                <div class="text-xs text-primary mt-1">${session.type}</div>
            </div>
            <button class="btn-icon text-destructive hover:bg-destructive/10" onclick="cancelSession(${session.id})" title="Cancel">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
        
        <div class="mt-3 pt-3 border-t border-dashed" style="border-color: var(--border);">
             

<a href="meeting.html?counselor=${counselorParam}&datetime=${encodeURIComponent(session.datetime)}"
   class="btn btn-wellness btn-sm w-full justify-center" style="text-decoration: none;" >
   <i data-lucide="video" class="w-4 h-4"></i>
   Join Session
</a>

        </div>
      </div>`;
  }).join('');
  
  lucide.createIcons();
}

function cancelSession(sessionId) {
  const sessionToCancel = upcomingSessions.find(session => session.id === sessionId);
  if (confirm("Are you sure you want to cancel this session?")) {
    upcomingSessions = upcomingSessions.filter(session => session.id !== sessionId);
    saveToStorage('upcomingSessions', upcomingSessions); renderUpcomingSessions(); showToast('Session cancelled successfully.', 'success');
    if (sessionToCancel) { addActivity('cancel', `Cancelled session with ${sessionToCancel.counselor}`); }
  }
}

function openBookingModal() {
  bookingDate = new Date(); selectedBookingDate = null; selectedBookingTime = null;
  renderCalendar(); renderTimeSlots(); openModal('booking-modal');
}

function renderCalendar() {
  const container = document.getElementById('calendar-container');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const month = bookingDate.getMonth(), year = bookingDate.getFullYear();
  const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0), daysInMonth = lastDay.getDate(), startDayOfWeek = firstDay.getDay();
  let html = `<div class="flex items-center justify-between mb-4"><button class="btn-icon" onclick="changeMonth(-1)"><i data-lucide="chevron-left"></i></button><div class="font-medium text-lg">${bookingDate.toLocaleString('default', { month: 'long' })} ${year}</div><button class="btn-icon" onclick="changeMonth(1)"><i data-lucide="chevron-right"></i></button></div><div class="calendar-grid"><div class="calendar-header">Sun</div><div class="calendar-header">Mon</div><div class="calendar-header">Tue</div><div class="calendar-header">Wed</div><div class="calendar-header">Thu</div><div class="calendar-header">Fri</div><div class="calendar-header">Sat</div>`;
  for (let i = 0; i < startDayOfWeek; i++) { html += `<div></div>`; }
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDate = new Date(year, month, i); let classes = 'calendar-day';
    if (dayDate < today) classes += ' disabled'; if (dayDate.getTime() === today.getTime()) classes += ' today';
    if (selectedBookingDate && dayDate.getTime() === new Date(selectedBookingDate).getTime()) classes += ' selected';
    const clickHandler = (dayDate < today) ? '' : `onclick="selectBookingDate('${dayDate.toISOString()}')"`;
    html += `<div class="${classes}" ${clickHandler}>${i}</div>`;
  }
  html += '</div>'; container.innerHTML = html; lucide.createIcons();
}

function changeMonth(direction) { bookingDate.setMonth(bookingDate.getMonth() + direction); renderCalendar(); }
function selectBookingDate(dateISO) { selectedBookingDate = dateISO; selectedBookingTime = null; renderCalendar(); renderTimeSlots(); }

function renderTimeSlots() {
  const title = document.getElementById('time-slots-title'), grid = document.getElementById('time-slots-grid');
  if (!selectedBookingDate) { title.textContent = 'Select a date first'; grid.innerHTML = '<p class="text-sm text-muted-foreground col-span-2">Available time slots will appear here.</p>'; return; }
  const date = new Date(selectedBookingDate);
  title.textContent = `Available on ${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`;
  const availableTimes = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
  let timeSlotsHTML = availableTimes.map(time => {
    const [hour, minute] = time.split(':'); const isSelected = selectedBookingTime === time;
    const timeDate = new Date(selectedBookingDate); timeDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
    const formattedTime = timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `<button class="time-slot-btn ${isSelected ? 'selected' : ''}" onclick="selectBookingTime('${time}')">${formattedTime}</button>`;
  }).join('');
  grid.innerHTML = timeSlotsHTML || '<p class="text-sm text-muted-foreground col-span-2">No available slots for this day.</p>';
}

function selectBookingTime(time) { selectedBookingTime = time; renderTimeSlots(); }

function confirmBooking() {
  if (!selectedBookingDate || !selectedBookingTime) { showToast('Please select a date and time.', 'error'); return; }
  const [hour, minute] = selectedBookingTime.split(':'); const finalBookingDate = new Date(selectedBookingDate);
  finalBookingDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
  
  // Create new session object
  const newSession = { 
    id: Date.now(), 
    counselor: "Dr. Rohan Verma", 
    type: "Personal Counseling", 
    datetime: finalBookingDate.toISOString() 
  };
  
  // Save to storage
  upcomingSessions.push(newSession); 
  saveToStorage('upcomingSessions', upcomingSessions); 
  
  closeModal('booking-modal');
  showToast('Session booked successfully!', 'success'); 
  
  // Re-render the list so the new "Join Session" button appears
  renderUpcomingSessions();
  addActivity('booking', `Booked session with ${newSession.counselor}`);
}


//new by the dax
