let reportChart = null;
let liveChart = null;
let pulseInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    // Start the Unique Feature immediately
    initLivePulse();
    // Default load
    generateReport(); 
});

// --- UNIQUE FEATURE: Live Sentiment Pulse ---
function initLivePulse() {
    const ctx = document.getElementById('livePulseChart').getContext('2d');
    
    // Initial Data
    const initialData = Array(20).fill(50);
    const labels = Array(20).fill('');

    liveChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Global Sentiment Volatility',
                data: initialData,
                borderColor: 'hsl(238, 57%, 58%)',
                backgroundColor: 'hsla(238, 57%, 58%, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Disable animation for "streaming" effect
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
                y: { min: 0, max: 100, display: false },
                x: { display: false }
            }
        }
    });

    // Simulate Real-time WebSocket Data
    const anomalyFeed = document.getElementById('anomaly-feed');
    let counter = 0;

    pulseInterval = setInterval(() => {
        // Generate random sentiment score (40-80 is normal, <30 or >90 is anomaly)
        const volatility = Math.floor(Math.random() * (85 - 35 + 1)) + 35;
        const isAnomaly = Math.random() > 0.85; 

        // Update Chart
        const data = liveChart.data.datasets[0].data;
        data.shift();
        data.push(isAnomaly ? (Math.random() > 0.5 ? 95 : 20) : volatility); // Spike on anomaly
        liveChart.update();

        // Handle Anomaly Feed
        if (isAnomaly) {
            const time = new Date().toLocaleTimeString('en-US', { hour12: false });
            const type = Math.random() > 0.5 ? 'High Stress' : 'Keyword Trigger';
            const color = 'text-destructive';
            
            const item = document.createElement('div');
            item.className = 'anomaly-item';
            item.innerHTML = `
                <span class="${color} font-bold">${type}</span>
                <span class="text-muted">${time}</span>
            `;
            
            if(anomalyFeed.children[0]?.textContent.includes('Waiting')) {
                anomalyFeed.innerHTML = '';
            }
            anomalyFeed.prepend(item);
            
            // Keep list clean
            if(anomalyFeed.children.length > 4) anomalyFeed.lastElementChild.remove();
        }
    }, 1000);
}

// --- Standard Reporting Logic ---

function generateReport() {
    const loader = document.getElementById('loading-indicator');
    const results = document.getElementById('report-results');
    
    results.classList.add('hidden');
    loader.classList.remove('hidden');
    loader.style.display = 'flex';

    // Simulate API delay
    setTimeout(() => {
        loader.classList.add('hidden');
        results.classList.remove('hidden');
        renderMainChart();
        showToast('Report updated successfully', 'success');
    }, 800);
}

function renderMainChart() {
    const ctx = document.getElementById('mainReportChart').getContext('2d');
    
    if (reportChart) {
        reportChart.destroy();
    }

    const type = document.getElementById('report-type').value;
    let data, label, color;

    // Data variations based on selection
    if (type === 'risk') {
        label = 'Flagged Incidents';
        data = [5, 8, 4, 3, 6, 2, 4];
        color = 'hsl(0, 84.2%, 60.2%)'; 
    } else if (type === 'engagement') {
        label = 'Active Sessions';
        data = [120, 135, 128, 142, 150, 145, 160];
        color = 'hsl(238, 57%, 58%)'; 
    } else {
        label = 'Avg Wellness Score';
        data = [70, 72, 75, 74, 78, 80, 78];
        color = 'hsl(159, 64%, 52%)'; 
    }

    reportChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color.replace('hsl', 'hsla').replace(')', ', 0.1)'),
                fill: true,
                tension: 0.4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#333',
                    borderColor: '#ddd',
                    borderWidth: 1
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function downloadFile() {
    const format = document.getElementById('export-format').value.toUpperCase();
    showToast(`Downloading report as ${format}...`, 'success');
}