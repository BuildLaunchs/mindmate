document.addEventListener('DOMContentLoaded', function() {
    // Check auth (simplified)
    const currentUser = getCurrentUser(); // Assumes main.js has this
    
    // Initial render
    updateStats();
    filterSessions('upcoming');
});

// --- Enhanced Mock Data with AI Attributes ---
// riskScore: 0-100 (High > 75)
// sentiment: negative triggers for AI analysis
let sessionsData = [
    { 
        id: 1, 
        user: 'Smit Prajapati', 
        counselor: 'Dr. Sarah', 
        type: 'Video Call', 
        date: '2025-02-14T10:00:00', 
        status: 'upcoming', 
        topic: 'Anxiety Management',
        riskScore: 88, 
        riskFactors: ['Sleep Deprivation', 'Keyword: "Hopeless"', 'Missed Classes'],
        aiRecommendation: 'Immediate intervention suggested. Review medication history.'
    },
    { 
        id: 2, 
        user: 'Ravi Kumar', 
        counselor: 'Dr. Sarah', 
        type: 'Voice Call', 
        date: '2025-02-14T14:30:00', 
        status: 'upcoming', 
        topic: 'Academic Stress',
        riskScore: 45,
        riskFactors: ['Stress triggers', 'Exam pressure'],
        aiRecommendation: 'Standard CBT techniques recommended for stress.'
    },
    { 
        id: 3, 
        user: 'Prachi Desai', 
        counselor: 'Dr. Mehta', 
        type: 'Chat', 
        date: '2025-02-13T09:00:00', 
        status: 'completed', 
        topic: 'General Checkup',
        riskScore: 12,
        riskFactors: [],
        aiRecommendation: 'Routine follow-up.'
    },
    { 
        id: 4, 
        user: 'Kalp Patel', 
        counselor: 'Dr. Sarah', 
        type: 'Video Call', 
        date: '2025-02-12T16:00:00', 
        status: 'cancelled', 
        topic: 'Emergency',
        riskScore: 92,
        riskFactors: ['Panic Attack reported'],
        aiRecommendation: 'Contact emergency contact.'
    },
];

let currentFilter = 'upcoming';

// --- Core Logic ---

function filterSessions(status) {
    currentFilter = status;
    
    // Update Tab UI
    document.querySelectorAll('[id^="tab-"]').forEach(tab => {
        tab.classList.remove('border-primary', 'text-primary');
        tab.classList.add('border-transparent', 'text-muted-foreground');
    });
    const activeTab = document.getElementById(`tab-${status}`);
    if(activeTab) {
        activeTab.classList.remove('border-transparent', 'text-muted-foreground');
        activeTab.classList.add('border-primary', 'text-primary');
    }

    // Sort by Date (Nearest first)
    const filteredData = sessionsData
        .filter(s => s.status === status)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
        
    renderSessions(filteredData);
}

function renderSessions(data) {
    const container = document.getElementById('sessions-container');
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
                <i data-lucide="calendar-off" class="w-12 h-12 mx-auto mb-3 opacity-20"></i>
                <p>No ${currentFilter} sessions found.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = data.map(session => {
        const dateObj = new Date(session.date);
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        // Logic for AI Sentinel Visualization
        let riskClass = 'risk-low';
        let riskLabel = 'Low Risk';
        let alertBtn = '';
        
        if(session.status === 'upcoming') {
            if (session.riskScore > 75) {
                riskClass = 'risk-high';
                riskLabel = 'High Risk';
                alertBtn = `<button class="btn btn-sm text-xs bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-white transition-colors" onclick="showAIInsight(${session.id})"><i data-lucide="siren" class="w-3 h-3"></i> AI Alert</button>`;
            } else if (session.riskScore > 40) {
                riskClass = 'risk-medium';
                riskLabel = 'Moderate';
                alertBtn = `<button class="btn btn-sm text-xs bg-warning/10 text-warning-foreground border-warning/20 hover:bg-warning hover:text-white" onclick="showAIInsight(${session.id})"><i data-lucide="brain" class="w-3 h-3"></i> Insight</button>`;
            }
        }

        // Action Buttons
        let actions = '';
        if (session.status === 'upcoming') {
            actions = `
                ${alertBtn}
                <button class="btn btn-sm btn-wellness shadow-sm" onclick="joinSession(${session.id})">Join</button>
                <button class="btn btn-sm btn-icon text-muted-foreground hover:text-destructive" title="Cancel" onclick="cancelSession(${session.id})"><i data-lucide="x-circle" class="w-4 h-4"></i></button>
            `;
        } else if (session.status === 'completed') {
            actions = `<button class="btn btn-sm btn-outline" onclick="viewNotes(${session.id})">View Notes</button>`;
        }

        return `
            <div class="wellness-card relative p-6 pl-8 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden group hover:shadow-md transition-all">
                <div class="risk-indicator ${riskClass}" title="AI Assessment: ${riskLabel}"></div>
                
                <div class="flex items-center gap-4 flex-1 w-full">
                    <div class="bg-primary/5 text-primary p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                        <i data-lucide="${session.type === 'Video Call' ? 'video' : session.type === 'Voice Call' ? 'phone' : 'message-square'}" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-lg leading-tight">${session.user}</h3>
                        <div class="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1.5">
                            <span class="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded text-xs font-medium"><i data-lucide="calendar" class="w-3 h-3"></i> ${dateStr}</span>
                            <span class="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded text-xs font-medium"><i data-lucide="clock" class="w-3 h-3"></i> ${timeStr}</span>
                            <span class="flex items-center gap-1.5"><i data-lucide="user" class="w-3 h-3"></i> ${session.counselor}</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-primary/5 text-primary uppercase tracking-wide border border-primary/10">
                        ${session.topic}
                    </span>
                    <div class="flex items-center gap-2">
                        ${actions}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}

// --- Unique Feature: AI Insight Logic ---

function showAIInsight(id) {
    const session = sessionsData.find(s => s.id === id);
    if (!session) return;

    // Populate Modal
    const modal = document.getElementById('ai-modal');
    document.getElementById('modal-risk-score').innerText = session.riskScore + '/100';
    document.getElementById('modal-recommendation').innerText = session.aiRecommendation;
    
    // Set Bar Color
    const bar = document.getElementById('modal-risk-bar');
    bar.style.width = session.riskScore + '%';
    bar.className = `h-2.5 rounded-full ${session.riskScore > 75 ? 'bg-destructive' : session.riskScore > 40 ? 'bg-warning' : 'bg-wellness'}`;

    // Render Factors
    const factorsContainer = document.getElementById('modal-risk-factors');
    factorsContainer.innerHTML = session.riskFactors.map(factor => 
        `<span class="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-100 font-medium">${factor}</span>`
    ).join('');

    // Open Modal
    modal.classList.add('active');
}

// --- Data Management Functions ---

function handleScheduleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const newSession = {
        id: Date.now(),
        user: formData.get('student'),
        counselor: 'Dr. Admin', // Default for now
        type: formData.get('type'),
        date: `${formData.get('date')}T${formData.get('time')}`,
        status: 'upcoming',
        topic: formData.get('topic'),
        riskScore: Math.floor(Math.random() * 90), // Simulating AI Analysis upon creation
        riskFactors: ['New Patient', 'Unknown History'],
        aiRecommendation: 'Initial assessment required.'
    };

    sessionsData.push(newSession);
    
    // UI Feedback
    closeModal('schedule-modal');
    e.target.reset();
    showToast('Session scheduled & AI Analysis running...', 'success');
    
    // Refresh
    updateStats();
    filterSessions('upcoming');
}

function cancelSession(id) {
    if(confirm('Are you sure you want to cancel this session?')) {
        const session = sessionsData.find(s => s.id === id);
        if(session) {
            session.status = 'cancelled';
            showToast('Session cancelled successfully');
            updateStats();
            filterSessions(currentFilter);
        }
    }
}

function updateStats() {
    const upcoming = sessionsData.filter(s => s.status === 'upcoming').length;
    const highRisk = sessionsData.filter(s => s.status === 'upcoming' && s.riskScore > 75).length;
    const completed = sessionsData.filter(s => s.status === 'completed' && new Date(s.date).toDateString() === new Date().toDateString()).length;

    document.getElementById('stat-upcoming').innerText = upcoming;
    document.getElementById('stat-risk').innerText = highRisk;
    document.getElementById('stat-completed').innerText = completed;
}

// --- UI Helpers ---

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function joinSession(id) {
    showToast('Establishing secure connection...', 'success');
    // In real app, redirect to video room
}

function toggleAIAnalysis() {
    showToast('AI Sentinel re-calibrating...', 'success');
    setTimeout(() => {
        // Randomize scores to demonstrate dynamic nature
        sessionsData.forEach(s => {
            if(s.status === 'upcoming') s.riskScore = Math.floor(Math.random() * 100);
        });
        filterSessions(currentFilter);
        updateStats();
    }, 800);
}