// Admin dashboard functionality connected to the Flask API

let userMonitoringData = [];
// Keep track of the chart instance to destroy it if the report is generated again
let wellnessChartInstance = null;

document.addEventListener('DOMContentLoaded', function () {
  // Authentication check logic (Uncomment if auth is active on local app)
  /*
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    showToast('Access denied. Admin privileges required.', 'error');
    setTimeout(() => navigateTo('login.html'), 2000);
    return;
  }
  */

  initializeAdminDashboard();
});

async function initializeAdminDashboard() {
  await fetchDashboardStats();
  await loadUserMonitoringData();
  await loadRecentAlerts();
}

// --------------------------------------------------
// Fetch and populate overview statistics cards
// --------------------------------------------------
async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`);
        if (!response.ok) throw new Error("Failed to fetch statistics");
        const data = await response.json();

        updateCounter('stat-total-users', data.totalUsers || 0);
        updateCounter('stat-active-sessions', data.activeSessions || 0);
        updateCounter('stat-high-risk', data.highRisk || 0);
        updateCounter('stat-avg-score', data.avgScore || 0);
        
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        showToast("Error loading top-level metrics", "error");
    }
}

function updateCounter(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.dataset.count = value;
        animateCountUp(el); // Calls the count up from main.js
    }
}

// --------------------------------------------------
// Fetch and render the comprehensive users list
// --------------------------------------------------
async function loadUserMonitoringData() {
  try {
      const response = await fetch(`${API_BASE_URL}/admin/users`);
      if (!response.ok) throw new Error("Failed to load user monitoring data");
      userMonitoringData = await response.json();
      renderUserMonitoringList();
  } catch(error) {
      console.error("User List Error:", error);
      document.getElementById('user-monitoring-list').innerHTML = `<div class="p-4 text-center text-destructive">Failed to load real-time data. Database may be disconnected.</div>`;
  }
}

function renderUserMonitoringList() {
  const container = document.getElementById('user-monitoring-list');
  if (!container) return;
  
  if (userMonitoringData.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-muted-foreground">No users found on the server.</div>`;
      return;
  }

  container.innerHTML = userMonitoringData
    .map((user) => {
      const initials = user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
      return `
    <div class="flex items-center justify-between p-4 border rounded-lg transition-all hover:shadow-md mb-2" style="border-color: var(--border);">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${getRiskLevelColor(user.riskLevel, 'bg')}">
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
         <span class="text-sm font-medium capitalize hidden sm:inline-block">${user.riskLevel} Risk</span>
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
  // Fallback map styling if variable classes are missing 
  const fallbackBg = { low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-red-500' };
  return styles[level]?.[type] || 'bg-gray-500';
}

// --------------------------------------------------
// Fetch and render automated alerts
// --------------------------------------------------
async function loadRecentAlerts() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/alerts`);
        if (!response.ok) throw new Error("Failed to load alerts");
        const alerts = await response.json();
        
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
    } catch(error) {
        console.error("Alerts Error:", error);
    }
}

// --------------------------------------------------
// UI Details and Actions
// --------------------------------------------------
function viewUserDetails(userId) {
  const user = userMonitoringData.find((u) => u.id === userId);
  if (!user) return;

  const content = document.getElementById('user-detail-content');
  if (!content) return;

  content.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-xl ${getRiskLevelColor(user.riskLevel, 'bg')}">
          ${user.name.split(' ').map((n) => n[0]).join('').substring(0,2).toUpperCase()}
        </div>
        <div>
          <h4 class="text-xl font-bold">${user.name}</h4>
          <p class="text-muted-foreground">Age ${user.age} • ${
    user.lastActive ? `Last active: ${getTimeAgo(user.lastActive)}` : 'No recent activity'
  }</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="stat-card p-4 border rounded"><div class="stat-value text-xl font-bold">${
          user.wellnessScore
        }</div><div class="stat-label text-sm">Wellness Score</div></div>
        <div class="stat-card p-4 border rounded"><div class="stat-value text-xl font-bold">${
          user.sessions
        }</div><div class="stat-label text-sm">Total Sessions</div></div>
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
  // Simulate a delay for report generation
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

  if (wellnessChartInstance) {
    wellnessChartInstance.destroy();
  }

  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'This Week'];
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Average Wellness Score',
        data: [65, 72, 70, 78, 81], // Sample trend data
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