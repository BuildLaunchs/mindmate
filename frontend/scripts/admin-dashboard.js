// Admin dashboard functionality

let userMonitoringData = [];
// Keep track of the chart instance to destroy it if the report is generated again
let wellnessChartInstance = null;

document.addEventListener('DOMContentLoaded', function () {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    showToast('Access denied. Admin privileges required.', 'error');
    setTimeout(() => navigateTo('login.html'), 2000);
    return;
  }

  initializeAdminDashboard();
});

function initializeAdminDashboard() {
  loadUserMonitoringData();
  loadRecentAlerts();
  document.querySelectorAll('[data-count]').forEach(animateCountUp);
}

function loadUserMonitoringData() {
  userMonitoringData = [
    { id: 'u01', name: 'Smit', age: 16, sessions: 12, screenTime: '5.2h', riskLevel: 'low', wellnessScore: 85, lastActive: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'u02', name: 'Ravi', age: 17, sessions: 8, screenTime: '8.1h', riskLevel: 'medium', wellnessScore: 72, lastActive: new Date(Date.now() - 4 * 3600000).toISOString() },
    { id: 'u03', name: 'Prachi', age: 15, sessions: 15, screenTime: '3.4h', riskLevel: 'low', wellnessScore: 91, lastActive: new Date(Date.now() - 1 * 3600000).toISOString() },
    { id: 'u04', name: 'Kalp', age: 18, sessions: 3, screenTime: '11.2h', riskLevel: 'high', wellnessScore: 45, lastActive: new Date(Date.now() - 30 * 60000).toISOString() },
  ];
  renderUserMonitoringList();
}

function renderUserMonitoringList() {
  const container = document.getElementById('user-monitoring-list');
  if (!container) return;

  container.innerHTML = userMonitoringData
    .map((user) => {
      const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('');
      return `
    <div class="flex items-center justify-between p-4 border rounded-lg transition-all hover:shadow-md" style="border-color: var(--border);">
      <div class="flex items-center gap-4">
        <div class="user-avatar ${getRiskLevelColor(user.riskLevel, 'bg')}">
          ${initials}
        </div>
        <div>
          <div class="font-medium">${user.name}</div>
          <div class="text-sm text-muted-foreground">Age: ${user.age}</div>
        </div>
      </div>
      <div class="hidden md:flex items-center gap-6 text-sm">
        <div class="text-center w-20"><div class="font-medium">${user.wellnessScore}</div><div class="text-muted-foreground text-xs">Score</div></div>
        <div class="text-center w-20"><div class="font-medium">${user.sessions}</div><div class="text-muted-foreground text-xs">Sessions</div></div>
        <div class="text-center w-20"><div class="font-medium">${user.screenTime}</div><div class="text-muted-foreground text-xs">Screen Time</div></div>
      </div>
      <div class="flex items-center gap-2">
         <div class="w-2.5 h-2.5 rounded-full ${getRiskLevelColor(
           user.riskLevel,
           'bg'
         )}"></div>
         <span class="text-sm font-medium capitalize">${user.riskLevel} Risk</span>
         <button class="btn btn-outline btn-sm ml-4" onclick="viewUserDetails('${
           user.id
         }')">Details</button>
      </div>
    </div>
  `;
    })
    .join('');
}

function getRiskLevelColor(level, type = 'text') {
  const styles = {
    low: { text: 'text-wellness', bg: 'bg-wellness' },
    medium: { text: 'text-warning', bg: 'bg-warning' },
    high: { text: 'text-destructive', bg: 'bg-destructive' },
  };
  return styles[level]?.[type] || 'bg-muted';
}

function loadRecentAlerts() {
  const alerts = [
    { user: 'Meet', type: 'High screen time', time: new Date(Date.now() - 2 * 60000).toISOString(), severity: 'high' },
    { user: 'Jay', type: 'Missed session', time: new Date(Date.now() - 3600000).toISOString(), severity: 'medium' },
    { user: 'Vishwa', type: 'Mood decline', time: new Date(Date.now() - 3 * 3600000).toISOString(), severity: 'high' },
  ];

  const container = document.getElementById('recent-alerts');
  if (!container) return;

  container.innerHTML = alerts
    .map(
      (alert) => `
    <div class="flex items-start gap-4 p-3 border rounded-lg" style="border-color: var(--border);">
      <div class="w-3 h-3 rounded-full mt-1.5 ${getRiskLevelColor(alert.severity, 'bg')} ${
        alert.severity === 'high' ? 'pulse-destructive' : ''
      }"></div>
      <div class="flex-1">
        <div class="font-medium text-sm">${alert.user} - ${alert.type}</div>
        <div class="text-xs text-muted-foreground">${getTimeAgo(alert.time)}</div>
      </div>
    </div>
  `
    )
    .join('');
}

function viewUserDetails(userId) {
  const user = userMonitoringData.find((u) => u.id === userId);
  if (!user) return;

  const content = document.getElementById('user-detail-content');
  if (!content) return;

  content.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <div class="user-avatar text-lg ${getRiskLevelColor(user.riskLevel, 'bg')}">
          ${user.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </div>
        <div>
          <h4 class="text-xl font-bold">${user.name}</h4>
          <p class="text-muted-foreground">Age ${user.age} • ${
    user.lastActive ? `Last active: ${getTimeAgo(user.lastActive)}` : ''
  }</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="stat-card"><div class="stat-value">${
          user.wellnessScore
        }</div><div class="stat-label">Wellness Score</div></div>
        <div class="stat-card"><div class="stat-value">${
          user.sessions
        }</div><div class="stat-label">Total Sessions</div></div>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-wellness flex-1">Contact User</button>
        <button class="btn btn-outline flex-1">Schedule Follow-up</button>
      </div>
    </div>
  `;
  openModal('user-detail-modal');
}

function closeUserDetail() {
  closeModal('user-detail-modal');
}

// --- Report Generation Functions ---

function openReportModal() {
  openModal('report-modal');

  // Reset to the generating view every time the modal is opened
  document.getElementById('generating-view').style.display = 'flex';
  document.getElementById('report-view').style.display = 'none';

  // Start the report generation process
  generateReport();
}

function generateReport() {
  // Simulate a delay for report generation (e.g., 2.5 seconds)
  setTimeout(() => {
    // Hide spinner and show the report content
    document.getElementById('generating-view').style.display = 'none';
    document.getElementById('report-view').style.display = 'block';

    // Render the chart with new data
    renderWellnessChart();
  }, 2500);
}

function renderWellnessChart() {
  const ctx = document.getElementById('wellness-chart')?.getContext('2d');
  if (!ctx) return;

  // If a chart instance already exists, destroy it to prevent conflicts
  if (wellnessChartInstance) {
    wellnessChartInstance.destroy();
  }

  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'This Week'];
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Average Wellness Score',
        data: [65, 72, 70, 78, 81], // Sample data
        borderColor: 'hsl(238, 57%, 58%)',
        backgroundColor: 'hsla(238, 57%, 58%, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  wellnessChartInstance = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          suggestedMin: 50,
          suggestedMax: 100,
          ticks: {
            stepSize: 10,
          },
        },
      },
    },
  });
}

// --- Quick Action Functions ---
function viewAllUsers() {
  showToast('Loading complete user list...', 'success');
}
function manageSessions() {
  showToast('Opening session management...', 'success');
}
function emergencyContacts() {
  showToast('Loading emergency protocols...', 'success');
}
function downloadReport() {
  showToast('Downloading report as PDF...', 'success');
}

// ... existing variables ...
let moodChartInstance = null; // Add this line to track the new chart

document.addEventListener('DOMContentLoaded', function () {
  // ... existing auth checks ...
  initializeAdminDashboard();
});

function initializeAdminDashboard() {
  loadUserMonitoringData();
  loadRecentAlerts();
  renderMoodDistributionChart(); // Add this line
  document.querySelectorAll('[data-count]').forEach(animateCountUp);
}

// ... existing loadUserMonitoringData function ...
// ... existing renderUserMonitoringList function ...
// ... existing getRiskLevelColor function ...
// ... existing loadRecentAlerts function ...

// --- NEW FUNCTION: Render Mood Distribution ---
function renderMoodDistributionChart() {
  const ctx = document.getElementById('mood-distribution-chart');
  if (!ctx) return;

  if (moodChartInstance) {
    moodChartInstance.destroy();
  }

  // Data representing the distribution
  const moodData = {
    labels: ['Happy', 'Calm', 'Sad', 'Angry'],
    datasets: [{
      data: [42, 35, 15, 8],
      backgroundColor: [
        'hsl(159, 64%, 52%)', // Wellness (Green)
        'hsl(238, 57%, 58%)', // Primary (Blue/Purple)
        'hsl(215, 16%, 47%)', // Muted (Grey/Blue)
        'hsl(0, 84%, 60%)'    // Destructive (Red)
      ],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  moodChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: moodData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%', // Makes the ring thinner
      plugins: {
        legend: {
          display: false // We built a custom legend in HTML for better styling
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#1e293b',
          bodyColor: '#1e293b',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          callbacks: {
            label: function(context) {
              return ` ${context.label}: ${context.raw}%`;
            }
          }
        }
      }
    }
  });
}

// ... existing functions (viewUserDetails, report generation, etc) ...