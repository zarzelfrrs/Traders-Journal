/**
 * AUTH.JS - Authentication System
 * 
 * File ini menangani sistem login sederhana menggunakan LocalStorage.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Jika di halaman login, setup form
    if (document.getElementById('loginForm')) {
        setupLoginForm();
    }
    
    // Jika di halaman lain, check authentication
    if (!window.location.pathname.includes('index.html')) {
        checkAuth();
    }
    
    // Setup logout functionality
    setupLogout();
});

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const pinInput = document.getElementById('pin');
    
    // Set today's date as default
    const today = new Date().toISOString().slice(0, 16);
    const dateInput = document.getElementById('tradeDate');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Setup form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const pin = pinInput.value;
        
        // Validation
        if (!username || username.length < 3) {
            App.showNotification('Nama minimal 3 karakter', 'error');
            usernameInput.focus();
            return;
        }
        
        if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
            App.showNotification('PIN harus 4 digit angka', 'error');
            pinInput.focus();
            return;
        }
        
        // Show loading state
        const submitBtn = loginForm.querySelector('.btn-submit');
        submitBtn.classList.add('loading');
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Save user data
            const userData = {
                username: username,
                pin: pin,
                lastLogin: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            
            Storage.setUser(userData);
            
            // Update global app state
            App.user = userData;
            
            // Show success message
            App.showNotification(`Selamat datang, ${username}!`, 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            App.showNotification('Login gagal. Coba lagi.', 'error');
            submitBtn.classList.remove('loading');
        }
    });
    
    // Auto focus on username input
    setTimeout(() => {
        if (usernameInput) {
            usernameInput.focus();
        }
    }, 500);
}

function checkAuth() {
    const user = Storage.getUser();
    
    if (!user || !user.username || user.username === 'Trader') {
        // Not logged in, redirect to login page
        App.showNotification('Silakan login terlebih dahulu', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return false;
    }
    
    // Update UI with user data
    updateUserUI(user);
    return true;
}

function updateUserUI(user) {
    // Update username in sidebar
    const userNameElements = document.querySelectorAll('#userName');
    userNameElements.forEach(el => {
        if (el) el.textContent = user.username;
    });
    
    // Update user stats
    const userStatsElements = document.querySelectorAll('#userStats');
    const stats = Storage.calculateStats();
    userStatsElements.forEach(el => {
        if (el) el.textContent = `${stats.total} Trade${stats.total !== 1 ? 's' : ''}`;
    });
}

function setupLogout() {
    const logoutButtons = document.querySelectorAll('.logout');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            App.confirmAction(
                'Apakah Anda yakin ingin logout?',
                function() {
                    // Clear user session
                    Storage.setUser(null);
                    App.user = null;
                    
                    App.showNotification('Logout berhasil', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            );
        });
    });
}

// Export functions
window.checkAuth = checkAuth;
window.updateUserUI = updateUserUI;
