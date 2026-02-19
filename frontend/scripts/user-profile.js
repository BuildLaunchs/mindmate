document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.user_id) {
        window.location.href = 'login.html';
        return;
    }

    loadProfileData(currentUser.user_id);

    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', handleProfileUpdate);
    }
});

async function loadProfileData(userId) {
    try {
        const response = await fetch(`http://localhost:5000/users/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch profile");
        
        const user = await response.json();
        
        // Populate fields
        document.getElementById('firstName').value = user.firstName || '';
        document.getElementById('lastName').value = user.lastName || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('age').value = user.age || '';
        document.getElementById('contactNumber').value = user.contactNumber || '';
        document.getElementById('emergencyContact').value = user.emergencyContact || '';

    } catch (error) {
        console.error(error);
        showToast("Could not load profile data", "error");
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin w-4 h-4"></i> Saving...';
    lucide.createIcons();

    const currentUser = getCurrentUser();
    
    const updateData = {
        user_id: currentUser.user_id,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        age: document.getElementById('age').value,
        contactNumber: document.getElementById('contactNumber').value,
        emergencyContact: document.getElementById('emergencyContact').value
    };

    try {
        const response = await fetch('http://localhost:5000/users/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (response.ok) {
            showToast("Profile updated successfully!", "success");
            
            // Update local storage to reflect changes immediately across app
            const updatedLocalUser = { ...currentUser, ...result.user };
            setCurrentUser(updatedLocalUser);
            
            setTimeout(() => {
                window.location.href = 'user-dashboard.html';
            }, 1000);
        } else {
            throw new Error(result.error || "Update failed");
        }

    } catch (error) {
        console.error(error);
        showToast("Failed to update profile", "error");
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
    }
}