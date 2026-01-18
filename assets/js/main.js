/**
 * MAIN.JS - Core Application Logic
 * 
 * File ini berisi fungsi-fungsi inti yang digunakan di seluruh aplikasi.
 * Semua halaman memuat file ini.
 */

// Global State
const App = {
    user: null,
    settings: null,
    isMobile: false,
    isOnline: true,
    currentPage: '',
    
    init: function() {
        console.log('🚀 Trader\'s Journal initialized');
        
        this.checkMobile();
        this.checkOnlineStatus();
        this.setCurrentPage();
        this.hideLoadingScreen();
        this.setupGlobalListeners();
        
        // Set current user if exists
        const userData = Storage.getUserData();
        if (userData) {
            this.user = userData;
        }
    },
    
    checkMobile: function() {
        this.isMobile = window.innerWidth <= 768;
        console.log(`📱 Mobile: ${this.isMobile}`);
    },
    
    checkOnlineStatus: function() {
        this.isOnline = navigator.onLine;
        console.log(`🌐 Online: ${this.isOnline}`);
        
        if (!this.isOnline) {
            this.showOfflineNotification();
        }
    },
    
    setCurrentPage: function() {
        const path = window.location.pathname;
        this.currentPage = path.split('/').pop().replace('.html', '') || 'index';
        console.log(`📄 Current page: ${this.currentPage}`);
    },
    
    hideLoadingScreen: function() {
        setTimeout(() => {
            const loadingScreen = document.querySelector('.loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 800);
    },
    
    setupGlobalListeners: function() {
        // Online/offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNotification('Koneksi internet telah kembali', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineNotification();
        });
        
        // Resize listener
        window.addEventListener('resize', () => {
            this.checkMobile();
        });
    },
    
    showOfflineNotification: function() {
        this.showNotification(
            'Mode offline aktif. Data disimpan secara lokal.',
            'warning'
        );
    },
    
    showNotification: function(message, type = 'info', duration = 5000) {
        // Cek jika notification container sudah ada
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
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 400px;
                }
                
                .notification {
                    padding: 12px 16px;
                    border-radius: var(--border-radius-sm);
                    background: var(--bg-card);
                    border-left: 4px solid var(--primary);
                    box-shadow: var(--shadow-lg);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    animation: slideIn 0.3s ease;
                    transform-origin: top right;
                }
                
                .notification-info { border-left-color: var(--info); }
                .notification-success { border-left-color: var(--success); }
                .notification-warning { border-left-color: var(--warning); }
                .notification-error { border-left-color: var(--danger); }
                
                .notification i {
                    font-size: 1.2rem;
                }
                
                .notification-info i { color: var(--info); }
                .notification-success i { color: var(--success); }
                .notification-warning i { color: var(--warning); }
                .notification-error i { color: var(--danger); }
                
                .notification-content {
                    flex: 1;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    font-size: 1.5rem;
                    cursor: pointer;
                    margin-left: 10px;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
                
                @keyframes slideOut {
                    to {
                        opacity: 0;
                        transform: translateX(100%) scale(0.9);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Buat notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <div class="notification-content">${message}</div>
            <button class="notification-close">&times;</button>
        `;
        
        // Tambahkan ke container
        container.appendChild(notification);
        
        // Auto remove setelah duration
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, duration);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        });
        
        return notification;
    },
    
    getNotificationIcon: function(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'exclamation-circle'
        };
        return icons[type] || 'info-circle';
    },
    
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    },
    
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatDateShort: function(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Hari ini';
        } else if (diffDays === 1) {
            return 'Kemarin';
        } else if (diffDays <= 7) {
            return `${diffDays} hari lalu`;
        } else {
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short'
            });
        }
    },
    
    calculatePips: function(entry, exit, symbol) {
        let pipValue;
        
        if (symbol.includes('XAU') || symbol.includes('GOLD')) {
            // Gold: 2 decimal places
            pipValue = 0.01;
        } else if (symbol.includes('BTC') || symbol.includes('ETH') || 
                   symbol.includes('BNB') || symbol.includes('CRYPTO')) {
            // Crypto: 2 decimal places
            pipValue = 0.01;
        } else {
            // Forex: 4 decimal places
            pipValue = 0.0001;
        }
        
        const pips = Math.abs(exit - entry) / pipValue;
        return Math.round(pips * 100) / 100;
    },
    
    calculateProfitLoss: function(entry, exit, lotSize, direction, symbol) {
        let contractSize, pipValue;
        
        if (symbol.includes('XAU') || symbol.includes('GOLD')) {
            // Gold: 1 lot = 100 ounce, 1 pip = $0.01
            contractSize = 100;
            pipValue = 0.01;
        } else if (symbol.includes('BTC') || symbol.includes('CRYPTO')) {
            // Crypto: simplified
            contractSize = 1;
            pipValue = 1;
        } else {
            // Forex: 1 lot = 100,000 unit, 1 pip = $10
            contractSize = 100000;
            pipValue = 0.0001;
        }
        
        let profit;
        if (direction === 'BUY') {
            profit = (exit - entry) * contractSize * lotSize;
        } else {
            profit = (entry - exit) * contractSize * lotSize;
        }
        
        if (!symbol.includes('XAU') && !symbol.includes('CRYPTO')) {
            profit = profit / pipValue * 10;
        }
        
        return Math.round(profit * 100) / 100;
    },
    
    confirmAction: function(message, onConfirm, onCancel) {
        // Buat modal konfirmasi
        const modal = document.createElement('div');
        modal.className = 'modal confirm-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-question-circle"></i> Konfirmasi</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="confirmCancel">
                        <i class="fas fa-times"></i> Batal
                    </button>
                    <button class="btn-primary" id="confirmOk">
                        <i class="fas fa-check"></i> Ya
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Tampilkan modal
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Setup event listeners
        const cancelBtn = modal.querySelector('#confirmCancel');
        const okBtn = modal.querySelector('#confirmOk');
        
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
            if (onCancel) onCancel();
        });
        
        okBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
            if (onConfirm) onConfirm();
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
                if (onCancel) onCancel();
            }
        });
    },
    
    vibrate: function(pattern = [50]) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    },
    
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Inisialisasi app saat DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export ke global scope
window.App = App;
