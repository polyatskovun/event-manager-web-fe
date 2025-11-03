function isLoggedIn() {
    return !!localStorage.getItem('authToken');
}

function getCurrentUser() {
    const userJSON = localStorage.getItem('username');
    return userJSON ? JSON.parse(userJSON) : null;
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');

    // Check if we're already in pages folder or not
    const isInPagesFolder = window.location.pathname.includes('/pages/');
    window.location.href = isInPagesFolder ? 'login.html' : 'pages/login.html';
}

function updateHeaderAuth() {
    const headerAuth = document.querySelector('.header-auth');
    const headerButton = document.getElementById('auth-button');

    if (!headerAuth || !headerButton) return;

    // Remove existing user display if any
    const existingUserDisplay = document.querySelector('.user-display');
    if (existingUserDisplay) {
        existingUserDisplay.remove();
    }

    if (isLoggedIn()) {
        const user = getCurrentUser();
        const username = user?.username || 'User';

        // Replace Login button with Logout
        headerButton.textContent = 'Logout';
        headerButton.onclick = logout;

        // Add username display
        const userDisplay = document.createElement('span');
        userDisplay.className = 'user-display';
        userDisplay.textContent = `Привіт, ${username}!`;
        headerAuth.insertBefore(userDisplay, headerButton);
    } else {
        // Show Login button
        headerButton.textContent = 'Login';
        const isInPagesFolder = window.location.pathname.includes('/pages/');
        headerButton.onclick = () => window.location.href = isInPagesFolder ? 'login.html' : 'pages/login.html';
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderAuth();
});
