document.addEventListener('DOMContentLoaded', function() {
    renderUsers();
});

// Enhanced Mock Data
let allUsers = [
    { id: 'u01', name: 'Smit Prajapati', email: 'smit@example.com', role: 'student', status: 'active', wellnessScore: 85, joined: '2024-12-01', risk: 'low' },
    { id: 'u02', name: 'Ravi Kumar', email: 'ravi@example.com', role: 'student', status: 'active', wellnessScore: 72, joined: '2025-01-10', risk: 'medium' },
    { id: 'u03', name: 'Dr. Sarah Smith', email: 'sarah@mindmate.com', role: 'counselor', status: 'active', wellnessScore: 98, joined: '2024-11-15', risk: 'low' },
    { id: 'u04', name: 'Kalp Patel', email: 'kalp@example.com', role: 'student', status: 'inactive', wellnessScore: 45, joined: '2024-12-20', risk: 'high' },
    { id: 'u05', name: 'Vishwa', email: 'vishwa@example.com', role: 'student', status: 'active', wellnessScore: 92, joined: '2025-01-05', risk: 'low' },
    { id: 'u06', name: 'Anjali Desai', email: 'anjali@example.com', role: 'student', status: 'active', wellnessScore: 60, joined: '2025-01-12', risk: 'medium' },
];

let currentView = 'list'; // 'list' or 'grid'
let sortDirection = { name: 1, wellnessScore: 1 };

function handleSearch() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const roleFilter = document.getElementById('role-filter').value;
    const riskFilter = document.getElementById('risk-filter').value;

    const filtered = allUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                              user.email.toLowerCase().includes(searchTerm);
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesRisk = riskFilter === 'all' || (user.role === 'student' && user.risk === riskFilter);
        return matchesSearch && matchesRole && matchesRisk;
    });

    renderUsers(filtered);
}

function sortUsers(key) {
    sortDirection[key] *= -1; // Toggle direction
    
    allUsers.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        // Handle string comparison
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return -1 * sortDirection[key];
        if (valA > valB) return 1 * sortDirection[key];
        return 0;
    });
    
    // Re-render current filter state
    handleSearch();
}

function toggleView(view) {
    currentView = view;
    document.querySelectorAll('.view-toggle').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    
    const tableView = document.getElementById('table-view');
    const gridView = document.getElementById('grid-view');
    
    if(view === 'list') {
        tableView.classList.remove('hidden');
        gridView.classList.add('hidden');
    } else {
        tableView.classList.add('hidden');
        gridView.classList.remove('hidden');
    }
}

function renderUsers(data = allUsers) {
    const tbody = document.getElementById('users-table-body');
    const gridContainer = document.getElementById('grid-view');
    document.getElementById('total-users-count').textContent = `${data.length} Users`;

    // 1. Render Table View
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-muted-foreground">No users found.</td></tr>`;
        gridContainer.innerHTML = `<div class="col-span-full text-center p-8 text-muted-foreground">No users found.</div>`;
        return;
    }

    tbody.innerHTML = data.map(user => {
        const initials = user.name.split(' ').map(n => n[0]).join('');
        const riskBadge = getRiskBadge(user);
        const wellnessColor = getWellnessColor(user.wellnessScore);

        return `
            <tr class="border-b last:border-0 hover:bg-muted/30 transition-colors group">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <div class="user-avatar bg-primary text-sm shadow-sm">${initials}</div>
                        <div>
                            <div class="font-medium text-foreground">${user.name}</div>
                            <div class="text-xs text-muted-foreground">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td class="p-4 capitalize text-sm"><span class="bg-muted px-2 py-1 rounded text-xs font-medium">${user.role}</span></td>
                <td class="p-4"><span class="flex items-center gap-2 text-xs font-medium capitalize ${user.status === 'active' ? 'text-wellness' : 'text-muted-foreground'}"><div class="w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-wellness' : 'bg-muted-foreground'}"></div>${user.status}</span></td>
                <td class="p-4 text-sm font-medium">
                    <div class="flex items-center gap-2">
                        <span class="${wellnessColor} font-bold w-6">${user.wellnessScore || '-'}</span>
                        <div class="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                            <div class="h-full ${wellnessColor.replace('text', 'bg')}" style="width: ${user.wellnessScore || 0}%"></div>
                        </div>
                    </div>
                </td>
                <td class="p-4">${riskBadge}</td>
                <td class="p-4 text-right">
                    <div class="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button class="btn btn-icon btn-sm text-primary hover:bg-primary/10" title="AI Insight Analysis" onclick="openAIAnalysis('${user.id}')">
                            <i data-lucide="brain" class="w-4 h-4"></i>
                        </button>
                        <button class="btn btn-icon btn-sm" title="Edit">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // 2. Render Grid View
    gridContainer.innerHTML = data.map(user => {
        const initials = user.name.split(' ').map(n => n[0]).join('');
        const wellnessColor = getWellnessColor(user.wellnessScore);
        
        return `
            <div class="user-card-item group">
                <div class="risk-badge">${getRiskBadge(user)}</div>
                <div class="flex flex-col items-center text-center pt-4 pb-6">
                    <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mb-3 border-2 border-transparent group-hover:border-primary transition-colors">
                        ${initials}
                    </div>
                    <h3 class="font-bold text-lg">${user.name}</h3>
                    <p class="text-sm text-muted-foreground mb-4">${user.email}</p>
                    
                    <div class="w-full bg-muted/50 rounded-lg p-3 mb-4">
                        <div class="flex justify-between text-xs mb-1">
                            <span>Wellness Score</span>
                            <span class="${wellnessColor} font-bold">${user.wellnessScore || 0}%</span>
                        </div>
                        <div class="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div class="h-full ${wellnessColor.replace('text', 'bg')}" style="width: ${user.wellnessScore || 0}%"></div>
                        </div>
                    </div>
                    
                    <div class="flex gap-2 w-full">
                        <button class="btn btn-outline flex-1 btn-sm" onclick="openAIAnalysis('${user.id}')">
                            <i data-lucide="brain" class="w-4 h-4 mr-2"></i> Analyze
                        </button>
                        <button class="btn btn-outline btn-icon btn-sm"><i data-lucide="mail" class="w-4 h-4"></i></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}

// Helpers
function getWellnessColor(score) {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-wellness';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
}

function getRiskBadge(user) {
    if (user.role !== 'student') return '<span class="text-xs text-muted-foreground">-</span>';
    
    const colors = {
        high: 'bg-destructive/10 text-destructive border-destructive/20',
        medium: 'bg-warning/10 text-warning-foreground border-warning/20',
        low: 'bg-wellness/10 text-wellness border-wellness/20'
    };
    
    const colorClass = colors[user.risk] || colors.low;
    
    return `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} capitalize">${user.risk} Risk</span>`;
}

// --- THE UNIQUE FEATURE: AI INSIGHT ENGINE ---
function openAIAnalysis(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    // 1. Populate Modal Header
    document.getElementById('ai-user-name').textContent = user.name;
    document.getElementById('ai-user-email').textContent = user.email;
    document.getElementById('ai-user-score').textContent = user.wellnessScore || 'N/A';
    document.getElementById('ai-user-avatar').textContent = user.name.split(' ').map(n => n[0]).join('');
    
    // Reset State
    const modal = document.getElementById('ai-modal');
    document.getElementById('ai-loading').classList.remove('hidden');
    document.getElementById('ai-results').classList.add('hidden');
    
    // Show Modal
    modal.classList.add('visible');
    
    // 2. Simulate AI Processing Delay
    setTimeout(() => {
        document.getElementById('ai-loading').classList.add('hidden');
        document.getElementById('ai-results').classList.remove('hidden');
        
        // 3. Generate Content based on logic
        generateAIContent(user);
        
    }, 1800); // 1.8s "thinking" time
}

function generateAIContent(user) {
    let pattern = "";
    let action = "";
    
    // Logic to simulate AI reasoning
    if (user.risk === 'high') {
        pattern = `Analysis detects a <strong>significant drop</strong> in daily check-in consistency (-40% vs last month). Keywords in recent journal entries suggest feelings of isolation and academic pressure. Sleep patterns indicate fragmentation.`;
        action = `<strong>Immediate Priority:</strong> Schedule a 1:1 intervention within 24 hours. Recommended focus: Stress management techniques and academic workload assessment. Notify guardians if protocol allows.`;
    } else if (user.risk === 'medium') {
        pattern = `Wellness score is stable but showing <strong>mild downward trend</strong>. Engagement with meditation modules has decreased. User reports "moderate anxiety" regarding upcoming exams.`;
        action = `Send automated "Exam Stress" resource pack. Counselor to check in via chat later this week. Suggest the "Focus & Calm" breathing exercise series.`;
    } else {
        pattern = `User demonstrates <strong>high resilience</strong>. Consistent usage of mood tracking and positive trend in journal sentiment. Social engagement metrics are healthy.`;
        action = `No direct intervention needed. Recommend "Advanced Mindfulness" modules to maintain progress. Consider inviting user to be a peer mentor.`;
    }

    if(user.role === 'counselor') {
        pattern = `Caseload analysis shows high engagement rate. Response times are excellent (avg < 2 hours). Risk of burnout is low but steady.`;
        action = `Recommend scheduling time off in upcoming cycle to prevent compassion fatigue.`;
    }

    // Typewriter effect simulation
    typeWriter('ai-pattern-text', pattern);
    setTimeout(() => typeWriter('ai-action-text', action), 1000);
}

function typeWriter(elementId, html) {
    const el = document.getElementById(elementId);
    el.innerHTML = html;
    el.style.opacity = 0;
    
    // Simple fade in for HTML content (true typewriter is hard with HTML tags)
    let op = 0.1;
    let timer = setInterval(function () {
        if (op >= 1){
            clearInterval(timer);
        }
        el.style.opacity = op;
        el.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * 0.1;
    }, 30);
}