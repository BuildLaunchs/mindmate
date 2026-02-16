// Login page functionality

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Auto-redirect if already logged in
  const currentUser = getCurrentUser();
  if (currentUser) {
    const redirectUrl = currentUser.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
    navigateTo(redirectUrl);
  }
});

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.querySelector('input[name="role"]:checked').value;
  
  if (!email || !password) {
    showToast('Please fill in all fields.', 'error');
    return;
  }
  
  if (!validateEmail(email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }
  
  const submitButton = e.target.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Signing In...';
  lucide.createIcons();
  
  try {
    // Call the Flask Backend
    const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password,
        role: role
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Login failed');
    }

    // Save user data to local storage
    setCurrentUser(result.user);
    showToast(`Welcome back! Redirecting...`, 'success');
    
    setTimeout(() => {
      const redirectUrl = result.user.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
      navigateTo(redirectUrl);
    }, 1000);
    
  } catch (error) {
    handleError(error, error.message || 'Login failed. Please check your credentials.');
    submitButton.disabled = false;
    submitButton.innerHTML = 'Sign In';
  }
}