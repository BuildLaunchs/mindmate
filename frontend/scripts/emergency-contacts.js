document.addEventListener('DOMContentLoaded', function() {
    // Fetch live alerts from the backend
    fetchLiveAlerts();
    
    // Fetch live users to populate the Guardian Directory
    fetchLiveContacts();
    
    // Check if dark mode preference is saved
    const isDark = localStorage.getItem('theme') === 'dark';
    document.getElementById('theme-switch').checked = isDark;
    if(isDark) document.documentElement.classList.add('dark');
});

let activeAlerts = [];
let liveContactList = [];

async function fetchLiveAlerts() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/alerts`);
        if (response.ok) {
            const alerts = await response.json();
            activeAlerts = alerts.map((a, index) => ({
                id: index + 1,
                user: a.user,
                guardian: 'Emergency Line',
                reason: a.type,
                trigger: a.severity === 'high' ? 'self_harm' : 'avoidance',
                time: getTimeAgo(a.time),
                severity: a.severity === 'high' ? 'critical' : 'warning'
            }));
        }
    } catch (error) {
        console.error("Failed to fetch live alerts.", error);
    }
    renderAlerts();
}

async function fetchLiveContacts() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`);
        if (response.ok) {
            const users = await response.json();
            // Map the API structure to the UI requirements
            liveContactList = users.map(u => ({
                id: u.id,
                user: u.name,
                email: u.email,
                userPhone: u.contactNumber || 'N/A',
                emergencyPhone: u.emergencyContact || 'N/A'
            }));
            renderContacts(liveContactList);
        } else {
            renderContacts([]);
        }
    } catch (error) {
        console.error("Failed to fetch live contacts.", error);
        renderContacts([]);
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const isChecked = document.getElementById('theme-switch').checked;
    
    if (isChecked) {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
}

function renderAlerts() {
    const container = document.getElementById('active-alerts-container');
    const badge = document.getElementById('alert-badge');
    
    if (activeAlerts.length === 0) {
        container.innerHTML = `
        <div class="col-span-2 p-8 bg-wellness/5 border border-wellness/20 rounded-xl text-center">
            <div class="bg-wellness/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i data-lucide="check-circle" class="w-8 h-8 text-wellness"></i>
            </div>
            <h3 class="text-lg font-bold text-wellness mb-1">All Clear</h3>
            <p class="text-muted-foreground">No active risk alerts detected in the system.</p>
        </div>`;
        badge.classList.add('hidden');
        lucide.createIcons();
        return;
    }
}
function renderContacts(data = liveContactList) {
    const tbody = document.getElementById('contacts-table-body');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-muted-foreground">No users found.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(contact => `
        <tr class="border-b last:border-0 hover:bg-muted/30 transition-colors group">
            <td class="p-4">
                <div class="font-medium">${contact.user}</div>
                <div class="text-xs text-muted-foreground">${contact.email || 'No email provided'}</div>
            </td>
            <td class="p-4">
                <div class="text-sm font-mono flex items-center gap-2">
                    <i data-lucide="smartphone" class="w-4 h-4 text-muted-foreground"></i> 
                    ${contact.userPhone && contact.userPhone !== 'N/A' ? contact.userPhone : '<span class="text-muted-foreground/50">N/A</span>'}
                </div>
            </td>
            <td class="p-4">
                <div class="text-sm font-mono flex items-center gap-2 mb-1">
                    <i data-lucide="phone-alert" class="w-4 h-4 text-destructive"></i> 
                    <span class="font-medium text-destructive">${contact.emergencyPhone && contact.emergencyPhone !== 'N/A' ? contact.emergencyPhone : '<span class="text-muted-foreground/50">N/A</span>'}</span>
                </div>
                ${contact.emergencyPhone && contact.emergencyPhone !== 'N/A' ? `
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive uppercase tracking-wider">
                        Guardian Line
                    </span>
                ` : ''}
            </td>
            <td class="p-4 text-right">
                <button onclick="startSecureCall('${contact.emergencyPhone !== 'N/A' && contact.emergencyPhone ? contact.emergencyPhone : contact.userPhone}', '${contact.user}')" 
                        class="btn btn-sm btn-outline btn-icon hover:bg-destructive hover:text-white hover:border-destructive transition-colors group-hover:border-destructive shadow-sm" title="Call Emergency Contact">
                    <i data-lucide="phone-call" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function filterContacts() {
    const term = document.getElementById('contact-search').value.toLowerCase();
    
    const filtered = liveContactList.filter(c => 
        (c.user && c.user.toLowerCase().includes(term)) || 
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.userPhone && c.userPhone.includes(term)) ||
        (c.emergencyPhone && c.emergencyPhone.includes(term))
    );
    renderContacts(filtered);
}

// --- UNIQUE FEATURE LOGIC: AI De-escalation Script ---
function openCrisisAssistant(alertId) {
    const alert = activeAlerts.find(a => a.id === alertId);
    if (!alert) return;

    document.getElementById('modal-subject').innerText = `${alert.guardian} (Guardian of ${alert.user})`;
    
    // Reset Modal State
    const content = document.getElementById('script-content');
    const loader = document.getElementById('script-loading');
    content.classList.add('hidden');
    loader.classList.remove('hidden');
    
    openModal('crisis-modal');

    // Simulate AI Generation Delay
    setTimeout(() => {
        loader.classList.add('hidden');
        content.classList.remove('hidden');
        content.innerHTML = generateScriptContent(alert);
        lucide.createIcons();
    }, 1500);
}

function generateScriptContent(alert) {
    let script = '';
    
    if (alert.trigger === 'self_harm') {
        script = `
            <div class="bg-warning/10 border border-warning/30 p-3 rounded-lg flex gap-3 items-start mb-4">
                <i data-lucide="alert-circle" class="text-warning shrink-0 mt-1"></i>
                <div class="text-sm">
                    <span class="font-bold text-warning-foreground">Objective:</span> 
                    Inform guardian of critical risk without causing panic. Ensure immediate physical supervision.
                </div>
            </div>
            
            <div class="space-y-4">
                <div class="script-step" style="animation-delay: 0.1s">
                    <p class="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Step 1: Introduction</p>
                    <div class="bg-card border p-3 rounded-lg text-lg">
                        "Hello, am I speaking with <span class="text-primary font-bold">the Guardian</span>? This is the Mind Mate Safety Team regarding <span class="font-bold">${alert.user}</span>."
                    </div>
                </div>

                <div class="script-step" style="animation-delay: 0.3s">
                    <p class="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Step 2: The Situation (Clear & Calm)</p>
                    <div class="bg-card border p-3 rounded-lg text-lg">
                        "Our system detected language indicating high distress and potential self-harm about 10 minutes ago. <br><span class="text-destructive font-bold">Are you currently near them?</span>"
                    </div>
                </div>

                <div class="script-step" style="animation-delay: 0.5s">
                    <p class="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Step 3: Action Plan</p>
                    <div class="bg-card border p-3 rounded-lg text-lg">
                        "Please go to their room immediately. Do not hang up. Keep the phone with you. I will stay on the line until you confirm they are physically safe."
                    </div>
                </div>
            </div>
        `;
    } else {
        script = `
             <div class="bg-primary/10 border border-primary/30 p-3 rounded-lg flex gap-3 items-start mb-4">
                <i data-lucide="info" class="text-primary shrink-0 mt-1"></i>
                <div class="text-sm">
                    <span class="font-bold text-primary-foreground">Objective:</span> 
                    Check-in regarding missed attendance. Assess if this is avoidance behavior.
                </div>
            </div>
            <div class="space-y-4">
                 <div class="script-step" style="animation-delay: 0.1s">
                    <p class="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Step 1: Introduction</p>
                    <div class="bg-card border p-3 rounded-lg text-lg">
                        "Hi, calling from Mind Mate regarding <span class="font-bold">${alert.user}</span>. We noticed a recent dip in their platform activity."
                    </div>
                </div>
                 <div class="script-step" style="animation-delay: 0.3s">
                    <p class="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Step 2: Soft Inquiry</p>
                    <div class="bg-card border p-3 rounded-lg text-lg">
                        "How have they been feeling today? We want to ensure everything is okay, as lack of engagement can sometimes indicate a dip in mood."
                    </div>
                </div>
            </div>
        `;
    }
    return script;
}

function initiateCallFromModal() {
    const guardianRef = document.getElementById('modal-subject').innerText;
    closeModal('crisis-modal');
    startSecureCall('System Dialing...', guardianRef);
}

// --- SECURE CALL SIMULATION ---
function startSecureCall(numberToCall, userName) {
    if(!numberToCall || numberToCall === 'N/A' || numberToCall === 'undefined') {
        showToast('Valid contact number not found for this user.', 'error');
        return;
    }
    
    document.getElementById('calling-name').innerText = numberToCall;
    document.getElementById('calling-desc').innerText = `Dialing secure line for:\n${userName}`;
    openModal('call-modal');
}

function endCall() {
    closeModal('call-modal');
    showToast('Call ended. Duration logged.', 'success');
}

// Global actions
function resolveAlert(id) {
    const index = activeAlerts.findIndex(a => a.id === id);
    if (index > -1) {
        showToast('Alert resolved. Updating logs...', 'success');
        activeAlerts.splice(index, 1);
        renderAlerts();
    }
}

function confirmGlobalAlert() {
    if(confirm('BROADCAST WARNING: This will trigger alarms for all on-duty clinicians. Are you sure?')) {
        showToast('Global alert broadcasted. Emergency teams notified.', 'error');
    }
}