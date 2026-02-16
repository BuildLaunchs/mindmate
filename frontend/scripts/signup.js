// Signup page functionality

document.addEventListener('DOMContentLoaded', function() {
  const signupForm = document.getElementById('signupForm');
  
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  
  // Real-time validation listeners
  const passwordField = document.getElementById('signup-password');
  const confirmPasswordField = document.getElementById('confirmPassword');
  
  if (confirmPasswordField && passwordField) {
    confirmPasswordField.addEventListener('input', validatePasswordMatch);
    passwordField.addEventListener('input', validatePasswordMatch);
  }
  
  // Role toggle
  const roleInputs = document.querySelectorAll('input[name="role"]');
  roleInputs.forEach(input => {
    input.addEventListener('change', toggleUserFields);
  });
  
  // Run once on load
  toggleUserFields();
  
  // Password strength
  addPasswordStrengthIndicator();
});

function toggleUserFields() {
  const role = document.querySelector('input[name="role"]:checked').value;
  const userFieldsContainer = document.getElementById('user-specific-fields');
  const contactInput = document.getElementById('contactNumber');
  const emergencyInput = document.getElementById('emergencyContact');

  if (!userFieldsContainer || !contactInput || !emergencyInput) return;

  if (role === 'user') {
    userFieldsContainer.classList.remove('hidden');
    contactInput.setAttribute('required', '');
    emergencyInput.setAttribute('required', '');
  } else {
    userFieldsContainer.classList.add('hidden');
    contactInput.removeAttribute('required');
    emergencyInput.removeAttribute('required');
    contactInput.value = '';
    emergencyInput.value = '';
  }
}

function validatePasswordMatch() {
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const confirmField = document.getElementById('confirmPassword');
  
  if (confirmPassword && password !== confirmPassword) {
    confirmField.style.borderColor = 'var(--destructive)';
    showValidationMessage(confirmField, 'Passwords do not match');
    return false;
  } else {
    confirmField.style.borderColor = '';
    clearValidationMessage(confirmField);
    return true;
  }
}

function showValidationMessage(field, message) {
  clearValidationMessage(field);
  const messageDiv = document.createElement('div');
  messageDiv.className = 'validation-message';
  messageDiv.textContent = message;
  field.parentNode.appendChild(messageDiv);
}

function clearValidationMessage(field) {
  const existingMessage = field.parentNode.querySelector('.validation-message');
  if (existingMessage) {
    existingMessage.remove();
  }
}

async function handleSignup(e) {
  e.preventDefault();
  
  const selectedRole = document.querySelector('input[name="role"]:checked').value;

  const userData = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('signup-email').value,
    age: document.getElementById('age').value,
    password: document.getElementById('signup-password').value,
    role: selectedRole,
    contactNumber: selectedRole === 'user' ? document.getElementById('contactNumber').value : null,
    emergencyContact: selectedRole === 'user' ? document.getElementById('emergencyContact').value : null
  };
  
  if (!validatePasswordMatch()) {
    showToast('Passwords do not match.', 'error');
    return;
  }
  
  const submitButton = document.getElementById('create-account-btn');
  submitButton.disabled = true;
  submitButton.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Creating Account...';
  lucide.createIcons();
  
  try {
    const response = await fetch('http://localhost:5000/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Account creation failed');
    }
    
    showToast(`Account created successfully! Welcome, ${userData.firstName}!`, 'success');
    
    setTimeout(() => {
      navigateTo('login.html');
    }, 1500);
    
  } catch (error) {
    handleError(error, error.message || 'Account creation failed. Please try again.');
    submitButton.disabled = false;
    submitButton.innerHTML = 'Create Account';
  }
}

function addPasswordStrengthIndicator() {
  const passwordField = document.getElementById('signup-password');
  const container = document.getElementById('password-strength-container');
  if (!passwordField || !container) return;
  
  container.innerHTML = `
    <div class="password-strength-bar">
      <div class="password-strength-fill"></div>
    </div>
    <div class="password-strength-text"></div>
  `;

  const fill = container.querySelector('.password-strength-fill');
  const text = container.querySelector('.password-strength-text');
  
  passwordField.addEventListener('input', function() {
    const strength = calculatePasswordStrength(this.value);
    fill.style.width = `${strength.percentage}%`;
    fill.style.backgroundColor = strength.color;
    text.textContent = strength.text;
    text.style.color = strength.color;
  });
}

function calculatePasswordStrength(password) {
  let score = 0;
  if (!password) return { percentage: 0, color: 'transparent', text: '' };
  
  if (password.length >= 8) score += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;

  let color, text;
  if (score < 50) {
    color = 'var(--destructive)'; text = 'Weak';
  } else if (score < 75) {
    color = 'var(--warning)'; text = 'Fair';
  } else if (score < 100) {
    color = 'var(--primary)'; text = 'Good';
  } else {
    color = 'var(--wellness)'; text = 'Strong';
  }
  
  return { percentage: score, color, text };
}