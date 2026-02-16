document.addEventListener('DOMContentLoaded', function() {
    renderAlerts();
    renderContacts();
    
    // Check if dark mode preference is saved
    const isDark = localStorage.getItem('theme') === 'dark';
    document.getElementById('theme-switch').checked = isDark;
    if(isDark) document.documentElement.classList.add('dark');
});

// Mock Data with specific trigger types for the AI
const activeAlerts = [
    { 
        id: 1, 
        user: 'Kalp Patel', 
        guardian: 'Dr. Mehta',
        reason: 'Self-harm keywords detected in chat', 
        trigger: 'self_harm',
        time: '10 mins ago', 
        severity: 'critical' 
    },
    { 
        id: 2, 
        user: 'joe smith', 
        guardian: 'Sunita Kumar',
        reason: 'Consecutive missed sessions (No Show)', 
        trigger: 'avoidance',
        time: '2 hours ago', 
        severity: 'high' 
    }
];

const contactList = [
    { id: 1, user: 'Smit Prajapati', guardian: 'Ramesh Prajapati', relation: 'Father', phone: '+91 98765 43210', email: 'ramesh@email.com' },
    { id: 2, user: 'Ravi Kumar', guardian: 'Sunita Kumar', relation: 'Mother', phone: '+91 91234 56789', email: 'sunita@email.com' },
    { id: 3, user: 'Kalp Patel', guardian: 'Dr. Mehta', relation: 'Therapist', phone: '+91 99887 76655', email: 'clinic@mehta.com' },
    { id: 4, user: 'Dax Prajapati', guardian: 'Sunita Kumar', relation: 'Mother', phone: '+91 91234 56788', email: 'sunita.k@email.com' },
];

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

    badge.innerText = activeAlerts.length;
    badge.classList.remove('hidden');

    container.innerHTML = activeAlerts.map(alert => `
        <div class="bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start gap-4 ${alert.severity === 'critical' ? 'pulse-border border-destructive' : 'border-warning'}">
            <div class="${alert.severity === 'critical' ? 'bg-destructive' : 'bg-warning'} p-3 rounded-xl text-white shrink-0 shadow-lg shadow-${alert.severity === 'critical' ? 'destructive' : 'warning'}/20">
                <i data-lucide="${alert.severity === 'critical' ? 'siren' : 'alert-triangle'}" class="w-6 h-6"></i>
            </div>
            <div class="flex-1 w-full">
                <div class="flex justify-between items-start mb-1">
                    <h3 class="font-bold text-lg">${alert.user}</h3>
                    <span class="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded-md flex items-center gap-1">
                        <i data-lucide="clock" class="w-3 h-3"></i> ${alert.time}
                    </span>
                </div>
                <p class="text-sm mb-4 font-medium text-foreground/80 bg-muted/30 p-2 rounded border border-border/50">
                    <span class="font-bold text-${alert.severity === 'critical' ? 'destructive' : 'warning'}">Trigger:</span> ${alert.reason}
                </p>
                <div class="flex flex-wrap gap-2 mt-auto">
                    <button class="btn btn-sm btn-hero flex-1" onclick="openCrisisAssistant(${alert.id})">
                        <i data-lucide="bot" class="w-4 h-4"></i> AI Script
                    </button>
                    <button class="btn btn-sm btn-outline flex-1" onclick="startSecureCall('${alert.guardian}')">
                        <i data-lucide="phone" class="w-4 h-4"></i> Call Guardian
                    </button>
                    <button class="btn btn-sm btn-secondary hover:bg-secondary/20 hover:text-secondary-foreground" onclick="resolveAlert(${alert.id})" title="Resolve">
                        <i data-lucide="check" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderContacts(data = contactList) {
    const tbody = document.getElementById('contacts-table-body');
    tbody.innerHTML = data.map(contact => `
        <tr class="border-b last:border-0 hover:bg-muted/30 transition-colors group">
            <td class="p-4">
                <div class="font-medium">${contact.user}</div>
                <div class="text-xs text-muted-foreground">ID: #${Math.floor(Math.random()*10000)}</div>
            </td>
            <td class="p-4 font-medium text-foreground/90">${contact.guardian}</td>
            <td class="p-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    ${contact.relation}
                </span>
            </td>
            <td class="p-4">
                <div class="text-sm font-mono flex items-center gap-2 mb-1">
                    <i data-lucide="smartphone" class="w-3 h-3 text-muted-foreground"></i> ${contact.phone}
                </div>
                <div class="text-sm text-muted-foreground flex items-center gap-2">
                    <i data-lucide="mail" class="w-3 h-3"></i> ${contact.email}
                </div>
            </td>
            <td class="p-4 text-right">
                <button onclick="startSecureCall('${contact.guardian}')" class="btn btn-sm btn-outline btn-icon hover:bg-primary hover:text-white transition-colors group-hover:border-primary">
                    <i data-lucide="phone-call" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function filterContacts() {
    const term = document.getElementById('contact-search').value.toLowerCase();
    const filtered = contactList.filter(c => 
        c.user.toLowerCase().includes(term) || 
        c.guardian.toLowerCase().includes(term) ||
        c.phone.includes(term)
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
    // Basic template logic based on trigger
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
                        "Hello, am I speaking with <span class="text-primary font-bold">${alert.guardian}</span>? This is the Mind Mate Safety Team regarding <span class="font-bold">${alert.user}</span>."
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
                        "Hi <span class="text-primary font-bold">${alert.guardian}</span>, calling from Mind Mate. We missed <span class="font-bold">${alert.user}</span> at their scheduled session today."
                    </div>
                </div>
                 <div class="script-step" style="animation-delay: 0.3s">
                    <p class="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Step 2: Soft Inquiry</p>
                    <div class="bg-card border p-3 rounded-lg text-lg">
                        "How have they been feeling today? We want to ensure everything is okay, as missed sessions can sometimes indicate a dip in mood."
                    </div>
                </div>
            </div>
        `;
    }
    return script;
}

function initiateCallFromModal() {
    const guardianName = document.getElementById('modal-subject').innerText.split('(')[0];
    closeModal('crisis-modal');
    startSecureCall(guardianName);
}

// --- SECURE CALL SIMULATION ---
function startSecureCall(name) {
    document.getElementById('calling-name').innerText = name;
    openModal('call-modal');
}

function endCall() {
    closeModal('call-modal');
    showToast('Call ended. Duration: 0:42', 'success');
}

// Global actions
function resolveAlert(id) {
    // Custom styled confirmation (using toast for simplicity here, but would be a modal in prod)
    const index = activeAlerts.findIndex(a => a.id === id);
    if (index > -1) {
        // Animation effect before removal
        showToast('Alert resolved. Updating logs...', 'success');
        activeAlerts.splice(index, 1);
        renderAlerts();
    }
}

function confirmGlobalAlert() {
    // Replaces the native confirm() with a safer approach logic (in real app, a modal)
    if(confirm('BROADCAST WARNING: This will trigger alarms for all on-duty clinicians. Are you sure?')) {
        showToast('Global alert broadcasted. Emergency teams notified.', 'error');
    }
}