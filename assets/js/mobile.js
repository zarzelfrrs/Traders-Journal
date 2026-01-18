/**
 * MOBILE.JS - Mobile-Specific Optimizations
 * 
 * File ini menangani optimasi khusus untuk perangkat mobile.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Mobile optimizations initialized');
    
    // Initialize mobile features
    initMobileMenu();
    initTouchGestures();
    initPullToRefresh();
    setupMobileView();
    setupKeyboardBehavior();
    
    // Add mobile-specific styles
    addMobileStyles();
});

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');
    
    if (!menuToggle || !sidebar) return;
    
    // Toggle sidebar
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSidebar();
    });
    
    // Close sidebar
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar when clicking a menu item
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
        item.addEventListener('click', function() {
            if (!this.classList.contains('logout')) {
                setTimeout(closeSidebar, 300);
            }
        });
    });
    
    // Close sidebar on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
    
    // Prevent body scroll when sidebar is open
    sidebar.addEventListener('touchmove', function(e) {
        e.stopPropagation();
    }, { passive: false });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const menuToggle = document.getElementById('menuToggle');
    
    if (!sidebar) return;
    
    const isOpening = !sidebar.classList.contains('active');
    
    if (isOpening) {
        sidebar.classList.add('active');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        if (menuToggle) menuToggle.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Animate hamburger
        animateHamburger(true);
    } else {
        closeSidebar();
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const menuToggle = document.getElementById('menuToggle');
    
    if (sidebar) sidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    if (menuToggle) menuToggle.classList.remove('active');
    document.body.style.overflow = '';
    
    // Animate hamburger
    animateHamburger(false);
}

function animateHamburger(isOpening) {
    const menuLines = document.querySelectorAll('.menu-line');
    
    if (!menuLines.length) return;
    
    menuLines.forEach((line, index) => {
        // Reset animation
        line.style.animation = 'none';
        void line.offsetWidth; // Trigger reflow
        
        if (isOpening) {
            switch(index) {
                case 0:
                    line.style.animation = 'hamburgerTopOpen 0.3s ease forwards';
                    break;
                case 1:
                    line.style.animation = 'hamburgerMiddleOpen 0.3s ease forwards';
                    break;
                case 2:
                    line.style.animation = 'hamburgerBottomOpen 0.3s ease forwards';
                    break;
            }
        } else {
            switch(index) {
                case 0:
                    line.style.animation = 'hamburgerTopClose 0.3s ease forwards';
                    break;
                case 1:
                    line.style.animation = 'hamburgerMiddleClose 0.3s ease forwards';
                    break;
                case 2:
                    line.style.animation = 'hamburgerBottomClose 0.3s ease forwards';
                    break;
            }
        }
    });
}

function initTouchGestures() {
    // Swipe to close sidebar
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;
        
        // Swipe right to open sidebar (only from left edge)
        if (touchStartX < 50 && swipeDistance > swipeThreshold) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('active')) {
                toggleSidebar();
            }
        }
        
        // Swipe left to close sidebar
        else if (swipeDistance < -swipeThreshold) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('active')) {
                closeSidebar();
            }
        }
    }
    
    // Swipe actions on trade items (for mobile)
    setupSwipeActions();
}

function setupSwipeActions() {
    // This would set up swipe actions on trade items for quick edit/delete
    // Implementation depends on specific requirements
}

function initPullToRefresh() {
    let touchStartY = 0;
    let isPulling = false;
    let pullDistance = 0;
    
    // Only enable pull-to-refresh on history and dashboard pages
    const enablePullToRefresh = window.location.pathname.includes('history.html') || 
                                window.location.pathname.includes('dashboard.html');
    
    if (!enablePullToRefresh) return;
    
    document.addEventListener('touchstart', function(e) {
        // Only trigger if at the top of the page
        if (window.scrollY === 0) {
            touchStartY = e.touches[0].clientY;
            isPulling = true;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        if (!isPulling) return;
        
        const touchY = e.touches[0].clientY;
        pullDistance = touchY - touchStartY;
        
        // Only prevent default if pulling down
        if (pullDistance > 0) {
            e.preventDefault();
            
            // Create or update pull indicator
            let pullIndicator = document.querySelector('.pull-to-refresh-indicator');
            if (!pullIndicator) {
                pullIndicator = document.createElement('div');
                pullIndicator.className = 'pull-to-refresh-indicator';
                pullIndicator.innerHTML = `
                    <div class="pull-spinner"></div>
                    <span>Tarik untuk refresh</span>
                `;
                document.body.appendChild(pullIndicator);
            }
            
            // Update indicator position
            const maxPull = 100;
            const progress = Math.min(pullDistance, maxPull) / maxPull;
            pullIndicator.style.transform = `translateY(${Math.min(pullDistance, maxPull)}px)`;
            pullIndicator.style.opacity = progress;
            
            // Change text if pulled enough
            if (pullDistance > maxPull) {
                pullIndicator.querySelector('span').textContent = 'Lepaskan untuk refresh';
            }
        }
    }, { passive: false });
    
    document.addEventListener('touchend', function() {
        if (!isPulling) return;
        
        const pullIndicator = document.querySelector('.pull-to-refresh-indicator');
        
        if (pullDistance > 100) {
            // Trigger refresh
            if (pullIndicator) {
                pullIndicator.querySelector('span').textContent = 'Memperbarui...';
                pullIndicator.querySelector('.pull-spinner').classList.add('spinning');
            }
            
            // Simulate refresh action
            setTimeout(() => {
                window.location.reload();
            }, 800);
            
        } else if (pullIndicator) {
            // Reset indicator
            pullIndicator.style.transform = 'translateY(-100%)';
            pullIndicator.style.opacity = '0';
            
            setTimeout(() => {
                if (pullIndicator.parentNode) {
                    pullIndicator.parentNode.removeChild(pullIndicator);
                }
            }, 300);
        }
        
        isPulling = false;
        pullDistance = 0;
        touchStartY = 0;
    });
}

function setupMobileView() {
    // Add mobile-specific classes
    if (App.isMobile) {
        document.body.classList.add('mobile-view');
        
        // Adjust view for mobile
        if (document.querySelector('.desktop-table')) {
            document.querySelector('.desktop-table').style.display = 'none';
        }
        
        if (document.getElementById('mobileCards')) {
            document.getElementById('mobileCards').style.display = 'flex';
        }
    }
    
    // Handle orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            // Force reflow of certain elements
            if (window.visualViewport) {
                window.visualViewport.dispatchEvent(new Event('resize'));
            }
        }, 300);
    });
}

function setupKeyboardBehavior() {
    // Handle keyboard visibility changes
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', function() {
            // Scroll active input into view when keyboard appears
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                setTimeout(() => {
                    activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
    }
    
    // Prevent zoom on input focus (iOS)
    document.addEventListener('touchstart', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            // Prevent default zoom behavior
            document.body.style.zoom = 1;
        }
    }, { passive: true });
}

function addMobileStyles() {
    // Add CSS animations for hamburger menu
    const style = document.createElement('style');
    style.textContent = `
        @keyframes hamburgerTopOpen {
            0% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(9px) rotate(0); }
            100% { transform: translateY(9px) rotate(45deg); }
        }
        
        @keyframes hamburgerTopClose {
            0% { transform: translateY(9px) rotate(45deg); }
            50% { transform: translateY(9px) rotate(0); }
            100% { transform: translateY(0) rotate(0); }
        }
        
        @keyframes hamburgerMiddleOpen {
            0% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0); }
        }
        
        @keyframes hamburgerMiddleClose {
            0% { opacity: 0; transform: scale(0); }
            100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes hamburgerBottomOpen {
            0% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(-9px) rotate(0); }
            100% { transform: translateY(-9px) rotate(-45deg); }
        }
        
        @keyframes hamburgerBottomClose {
            0% { transform: translateY(-9px) rotate(-45deg); }
            50% { transform: translateY(-9px) rotate(0); }
            100% { transform: translateY(0) rotate(0); }
        }
        
        .pull-to-refresh-indicator {
            position: fixed;
            top: -60px;
            left: 0;
            right: 0;
            height: 60px;
            background: var(--bg-card);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: transform 0.3s ease, opacity 0.3s ease;
            border-bottom: 1px solid var(--border-color);
        }
        
        .pull-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid transparent;
            border-top-color: var(--primary);
            border-radius: 50%;
            margin-bottom: 5px;
        }
        
        .pull-spinner.spinning {
            animation: spin 1s linear infinite;
        }
        
        .mobile-view input,
        .mobile-view select,
        .mobile-view textarea {
            font-size: 16px !important; /* Prevent iOS zoom */
        }
        
        /* Better touch targets */
        .btn-primary,
        .btn-secondary,
        .btn-success,
        .btn-danger {
            min-height: 44px;
            min-width: 44px;
        }
        
        .action-btn {
            width: 44px;
            height: 44px;
        }
        
        .emotion-option {
            min-height: 44px;
        }
        
        /* Hide scrollbars on mobile for cleaner look */
        .mobile-view ::-webkit-scrollbar {
            width: 0;
            height: 0;
        }
        
        /* Optimize transitions for mobile */
        @media (max-width: 768px) {
            .card,
            .stat-card,
            .trade-item {
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            
            .modal-content {
                border-radius: var(--border-radius) var(--border-radius) 0 0;
                animation: slideUp 0.3s ease;
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(100%);
                }
                to {
                    transform: translateY(0);
                }
            }
        }
        
        /* Safe area insets for modern phones */
        @supports (padding: max(0px)) {
            .mobile-header {
                padding-top: max(var(--space-sm), env(safe-area-inset-top));
            }
            
            .mobile-tab-bar {
                padding-bottom: max(var(--space-sm), env(safe-area-inset-bottom));
            }
            
            .sidebar {
                padding-top: max(var(--space-lg), env(safe-area-inset-top));
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Handle back button on mobile
window.addEventListener('popstate', function() {
    // Close any open modals or panels
    closeSidebar();
    
    const modal = document.getElementById('tradeModal');
    if (modal && modal.classList.contains('active')) {
        closeModal();
    }
    
    const filterPanel = document.getElementById('filterPanel');
    if (filterPanel && filterPanel.classList.contains('active')) {
        filterPanel.classList.remove('active');
    }
});

// Prevent bounce/overscroll on iOS
document.addEventListener('touchmove', function(e) {
    if (e.target.classList.contains('scrollable')) {
        return;
    }
    
    // Prevent scrolling on body when modal or sidebar is open
    const modal = document.getElementById('tradeModal');
    const sidebar = document.getElementById('sidebar');
    
    if ((modal && modal.classList.contains('active')) || 
        (sidebar && sidebar.classList.contains('active'))) {
        e.preventDefault();
    }
}, { passive: false });

// Export functions
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
