// Forgot Password / Reset page functionality

document.addEventListener('DOMContentLoaded', function() {
    const resetForm = document.getElementById('resetPasswordForm');
    
    if (resetForm) {
        resetForm.addEventListener('submit', handleResetPassword);
    }
    
    // Validate match on input
    const newPass = document.getElementById('new-password');
    const confirmPass = document.getElementById('confirm-password');

    if (newPass && confirmPass) {
        confirmPass.addEventListener('input', () => {
            if (confirmPass.value && newPass.value !== confirmPass.value) {
                confirmPass.style.borderColor = 'var(--destructive)';
            } else {
                confirmPass.style.borderColor = '';
            }
        });
    }
});
  
async function handleResetPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!email || !newPassword || !confirmPassword) {
        showToast('Please fill in all fields.', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
    }
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Updating...';
    lucide.createIcons();
    
    try {
        const response = await fetch('http://localhost:5000/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                new_password: newPassword
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Password reset failed');
        }
        
        showToast('Password reset successfully! Redirecting...', 'success');
        
        setTimeout(() => {
            navigateTo('login.html');
        }, 1500);
        
    } catch (error) {
        handleError(error, error.message || 'Failed to reset password.');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Reset Password';
    }
}