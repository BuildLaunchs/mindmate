// Main JavaScript file for common functionality

// Initialize Lucide icons when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  initializeInteractiveElements();
});

// Toast notification system
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="font-medium">${message}</div>`;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 4000);
}

// Form validation helpers
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
  return password.length >= 6;
}

// Change: Added function to toggle password visibility
function togglePasswordVisibility(fieldId) {
  const input = document.getElementById(fieldId);
  const button = input.nextElementSibling;
  const icon = button.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    icon.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
}

// Local storage helpers
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function getFromStorage(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error('Failed to get from localStorage:', e);
    return null;
  }
}

// Change: Added dynamic number counting animation
function animateCountUp(element) {
  const target = parseFloat(element.dataset.count);
  const duration = 1500;
  let start = 0;
  const stepTime = Math.abs(Math.floor(duration / target));
  
  const timer = setInterval(() => {
    start += 1;
    element.textContent = Math.floor(start);
    if (start >= target) {
      clearInterval(timer);
      element.textContent = target.toLocaleString();
    }
  }, stepTime);
}

// Simulate user authentication
function getCurrentUser() {
  return getFromStorage('currentUser');
}

function setCurrentUser(user) {
  saveToStorage('currentUser', user);
}

function logout() {
    localStorage.removeItem('currentUser');
    showToast('You have been logged out.', 'success');
    setTimeout(() => navigateTo('index.html'), 1500);
}

// Navigation helpers
function navigateTo(page) {
  window.location.href = page;
}

// Change: Improved Modal helpers with smooth transitions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('visible');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('visible');
  }
}

// Utility functions
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
}

// Simulate API calls with promises
function simulateApiCall(data, delay = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
}

// Error handling
function handleError(error, userMessage = 'Something went wrong.') {
  console.error(error);
  showToast(userMessage, 'error');
}

// Initialize tooltips and other interactive elements
function initializeInteractiveElements() {
  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
      if(this.disabled) return;
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      const rect = this.getBoundingClientRect();
      ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
      ripple.style.left = `${e.clientX - rect.left - ripple.offsetWidth / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - ripple.offsetHeight / 2}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

