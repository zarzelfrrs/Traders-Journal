/**
 * AUTH.JS
 * 
 * File ini menangani autentikasi sederhana menggunakan LocalStorage.
 * Karena ini aplikasi front-end only, "login" hanyalah untuk personalisasi.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Auth.js loaded');
    
    // Cek apakah user sudah login sebelumnya
    checkExistingUser();
    
    // Setup login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // Enter key untuk login
    const pinInput = document.getElementById('pin');
    if (pinInput) {
        pinInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
});

/**
 * Cek apakah ada user yang sudah login sebelumnya
 */
function checkExistingUser() {
    const userData = Storage.getUserData();
    
    if (userData && userData.username && userData.username !== 'Trader') {
        // User sudah login sebelumnya, redirect ke dashboard
        console.log('👋 Welcome back, ' + userData.username);
        
        // Tampilkan welcome message
        showWelcomeMessage(userData.username);
        
        // Update UI dengan nama user
        updateUserDisplay(userData.username);
    }
}

/**
 * Handle login process
 */
function handleLogin() {
    try {
        const usernameInput = document.getElementById('username');
        const pinInput = document.getElementById('pin');
        
        const username = usernameInput.value.trim();
        const pin = pinInput.value;
        
        // Validasi input
        if (!username) {
            throw new Error('Harap masukkan nama trader');
        }
        
        if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
            throw new Error('PIN harus 4 digit angka');
        }
        
        // Simpan user data
        const userData = {
            username: username,
            pin: pin,
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        Storage.saveUserData(userData);
        
        // Tampilkan loading effect
        const loginBtn = document.getElementById('loginBtn');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        loginBtn.disabled = true;
        
        // Simulasi loading sebelum redirect
        setTimeout(() => {
            // Redirect ke dashboard
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

/**
 * Tampilkan welcome message
 */
function showWelcomeMessage(username) {
    const welcomeSection = document.querySelector('.welcome-section');
    if (welcomeSection) {
        const existingAlert = welcomeSection.querySelector('.welcome-alert');
        if (existingAlert) existingAlert.remove();
        
        const alert = document.createElement('div');
        alert.className = 'welcome-alert';
        alert.innerHTML = `
            <div class="alert-content">
                <i class="fas fa-user-check"></i>
                <div>
                    <strong>Welcome back, ${username}!</strong>
                    <small>Terakhir login: ${new Date().toLocaleDateString('id-ID')}</small>
                </div>
                <button class="alert-close">&times;</button>
            </div>
        `;
        
        welcomeSection.insertBefore(alert, welcomeSection.firstChild);
        
        // Close button
        alert.querySelector('.alert-close').addEventListener('click', () => {
            alert.remove();
        });
    }
}

/**
 * Update user display di navbar
 */
function updateUserDisplay(username) {
    const userElements = document.querySelectorAll('#currentUser');
    userElements.forEach(el => {
        el.textContent = username;
    });
}

/**
 * Tampilkan notifikasi
 */
function showNotification(message, type = 'info') {
    // Cek apakah ada notification container
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .notification {
                padding: 12px 16px;
                border-radius: 8px;
                background: var(--bg-card);
                border-left: 4px solid var(--primary);
                box-shadow: var(--shadow);
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.3s ease;
                max-width: 300px;
            }
            
            .notification-error {
                border-left-color: var(--danger);
            }
            
            .notification-success {
                border-left-color: var(--success);
            }
            
            .notification i {
                font-size: 1.2rem;
            }
            
            .notification-error i {
                color: var(--danger);
            }
            
            .notification-success i {
                color: var(--success);
            }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--text-muted);
                font-size: 1.5rem;
                cursor: pointer;
                margin-left: auto;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Buat notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Tambahkan ke container
    container.appendChild(notification);
    
    // Auto remove setelah 5 detik
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    });
}

/**
 * Fungsi logout
 */
function logout() {
    if (confirm('Yakin ingin logout?')) {
        // Hapus data user dari localStorage
        localStorage.removeItem(Storage.STORAGE_KEYS.USER);
        
        // Redirect ke login page
        window.location.href = 'index.html';
    }
}

/**
 * Cek apakah user sudah login
 * Digunakan untuk protect halaman yang membutuhkan login
 */
function requireLogin() {
    const userData = Storage.getUserData();
    
    if (!userData || !userData.username || userData.username === 'Trader') {
        // Redirect ke login page
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Ekspor fungsi ke global scope
window.logout = logout;
window.requireLogin = requireLogin;

console.log('✅ Auth.js initialized successfully');