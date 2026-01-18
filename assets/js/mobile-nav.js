/**
 * MOBILE-NAV.JS
 * 
 * File ini menangani navigasi mobile dengan hamburger menu
 * dan animasi untuk pengalaman pengguna yang lebih baik di HP.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Mobile navigation initialized');
    
    initializeMobileNavigation();
    setupPullToRefresh();
    setupTouchGestures();
    setupMobileTabs();
});

/**
 * Inisialisasi hamburger menu untuk mobile
 */
function initializeMobileNavigation() {
    // Buat hamburger button jika belum ada
    if (window.innerWidth <= 768 && !document.querySelector('.hamburger-menu')) {
        createHamburgerMenu();
    }
    
    // Setup hamburger click event
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (hamburger) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMobileMenu();
        });
    }
    
    // Close menu ketika klik overlay
    if (overlay) {
        overlay.addEventListener('click', function() {
            closeMobileMenu();
        });
    }
    
    // Close menu ketika klik link di menu
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
                
                // Tambahkan animasi loading ke halaman tujuan
                const targetPage = this.getAttribute('href');
                if (targetPage && !targetPage.startsWith('#')) {
                    showPageTransition(targetPage);
                }
            }
        });
    });
    
    // Close menu ketika klik di luar
    document.addEventListener('click', function(event) {
        const isClickInsideMenu = navMenu?.contains(event.target);
        const isClickOnHamburger = hamburger?.contains(event.target);
        
        if (window.innerWidth <= 768 && navMenu?.classList.contains('active') && 
            !isClickInsideMenu && !isClickOnHamburger) {
            closeMobileMenu();
        }
    });
    
    // Handle resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });
}

/**
 * Buat hamburger menu secara dinamis
 */
function createHamburgerMenu() {
    const navContainer = document.querySelector('.nav-container');
    if (!navContainer) return;
    
    // Buat overlay untuk mobile menu
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    document.body.appendChild(overlay);
    
    // Cari elemen yang sudah ada
    const existingNavBrand = document.querySelector('.nav-brand');
    const existingNavMenu = document.querySelector('.nav-menu');
    const existingNavUser = document.querySelector('.nav-user');
    
    // Buat container baru
    const newContainer = document.createElement('div');
    newContainer.className = 'nav-container';
    
    // Buat hamburger button
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'hamburger-menu';
    hamburgerBtn.innerHTML = `
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
    `;
    
    // Buat mobile controls container
    const mobileControls = document.createElement('div');
    mobileControls.className = 'nav-mobile-controls';
    
    // Pindahkan user info ke mobile controls
    if (existingNavUser) {
        mobileControls.appendChild(existingNavUser.cloneNode(true));
        existingNavUser.remove();
    }
    
    // Tambahkan hamburger ke mobile controls
    mobileControls.appendChild(hamburgerBtn);
    
    // Bangun ulang navbar
    newContainer.appendChild(existingNavBrand);
    newContainer.appendChild(existingNavMenu);
    newContainer.appendChild(mobileControls);
    
    // Ganti container lama dengan yang baru
    navContainer.parentNode.replaceChild(newContainer, navContainer);
}

/**
 * Toggle mobile menu open/close
 */
function toggleMobileMenu() {
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (hamburger && navMenu && overlay) {
        const isActive = hamburger.classList.toggle('active');
        
        if (isActive) {
            navMenu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            navMenu.style.animation = 'slideDown 0.3s ease';
        } else {
            closeMobileMenu();
        }
        
        // Animate hamburger lines
        animateHamburger(isActive);
    }
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (hamburger && navMenu && overlay) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        animateHamburger(false);
    }
}

/**
 * Animasi untuk hamburger icon
 */
function animateHamburger(isOpening) {
    const hamburgerLines = document.querySelectorAll('.hamburger-line');
    
    hamburgerLines.forEach((line, index) => {
        // Reset animation
        line.style.animation = 'none';
        void line.offsetWidth; // Trigger reflow
        
        // Apply new animation
        if (isOpening) {
            line.style.animation = `hamburgerLine${index + 1}Open 0.3s ease forwards`;
        } else {
            line.style.animation = `hamburgerLine${index + 1}Close 0.3s ease forwards`;
        }
    });
    
    // Add CSS animations if not exists
    if (!document.querySelector('#hamburger-animations')) {
        const style = document.createElement('style');
        style.id = 'hamburger-animations';
        style.textContent = `
            @keyframes hamburgerLine1Open {
                0% { transform: translateY(0) rotate(0); }
                50% { transform: translateY(9px) rotate(0); }
                100% { transform: translateY(9px) rotate(45deg); }
            }
            
            @keyframes hamburgerLine1Close {
                0% { transform: translateY(9px) rotate(45deg); }
                50% { transform: translateY(9px) rotate(0); }
                100% { transform: translateY(0) rotate(0); }
            }
            
            @keyframes hamburgerLine2Open {
                0% { opacity: 1; transform: scale(1); }
                100% { opacity: 0; transform: scale(0); }
            }
            
            @keyframes hamburgerLine2Close {
                0% { opacity: 0; transform: scale(0); }
                100% { opacity: 1; transform: scale(1); }
            }
            
            @keyframes hamburgerLine3Open {
                0% { transform: translateY(0) rotate(0); }
                50% { transform: translateY(-9px) rotate(0); }
                100% { transform: translateY(-9px) rotate(-45deg); }
            }
            
            @keyframes hamburgerLine3Close {
                0% { transform: translateY(-9px) rotate(-45deg); }
                50% { transform: translateY(-9px) rotate(0); }
                100% { transform: translateY(0) rotate(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Setup pull to refresh untuk mobile
 */
function setupPullToRefresh() {
    let touchStartY = 0;
    let touchCurrentY = 0;
    let isPulling = false;
    
    document.addEventListener('touchstart', function(e) {
        // Hanya trigger jika di bagian atas halaman
        if (window.scrollY === 0) {
            touchStartY = e.touches[0].clientY;
            isPulling = true;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        if (!isPulling) return;
        
        touchCurrentY = e.touches[0].clientY;
        const pullDistance = touchCurrentY - touchStartY;
        
        // Hanya trigger jika pull down
        if (pullDistance > 0) {
            e.preventDefault();
            
            // Create pull indicator jika belum ada
            let pullIndicator = document.querySelector('.pull-to-refresh');
            if (!pullIndicator) {
                pullIndicator = document.createElement('div');
                pullIndicator.className = 'pull-to-refresh';
                pullIndicator.innerHTML = `
                    <div class="loading-spinner"></div>
                `;
                document.body.appendChild(pullIndicator);
            }
            
            // Update indicator position
            const maxPull = 100;
            const progress = Math.min(pullDistance, maxPull) / maxPull;
            pullIndicator.style.transform = `translateY(${Math.min(pullDistance, maxPull)}px)`;
            
            // Jika pull cukup jauh, trigger refresh
            if (pullDistance > maxPull) {
                pullIndicator.innerHTML = '<div class="loading-spinner"></div> Memuat ulang...';
            }
        }
    }, { passive: false });
    
    document.addEventListener('touchend', function() {
        if (!isPulling) return;
        
        const pullIndicator = document.querySelector('.pull-to-refresh');
        if (pullIndicator) {
            const pullDistance = touchCurrentY - touchStartY;
            
            // Jika pull cukup jauh, refresh data
            if (pullDistance > 100) {
                pullIndicator.style.transform = 'translateY(50px)';
                
                // Simulate refresh
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                // Reset position
                pullIndicator.style.transform = 'translateY(-50px)';
            }
        }
        
        isPulling = false;
        touchStartY = 0;
        touchCurrentY = 0;
    });
}

/**
 * Setup touch gestures untuk mobile
 */
function setupTouchGestures() {
    // Swipe untuk table rows di history
    setupTableSwipeGestures();
    
    // Double tap untuk edit
    setupDoubleTapEdit();
    
    // Long press untuk delete
    setupLongPressDelete();
}

/**
 * Setup swipe gestures untuk table rows
 */
function setupTableSwipeGestures() {
    const tableRows = document.querySelectorAll('tbody tr');
    
    tableRows.forEach(row => {
        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping = false;
        
        row.addEventListener('touchstart', function(e) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isSwiping = false;
        }, { passive: true });
        
        row.addEventListener('touchmove', function(e) {
            if (!touchStartX) return;
            
            const touchCurrentX = e.touches[0].clientX;
            const touchCurrentY = e.touches[0].clientY;
            
            const deltaX = touchCurrentX - touchStartX;
            const deltaY = touchCurrentY - touchStartY;
            
            // Hanya anggap sebagai swipe jika pergerakan horizontal lebih besar dari vertikal
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                e.preventDefault();
                isSwiping = true;
                
                // Apply transform untuk visual feedback
                row.style.transform = `translateX(${deltaX}px)`;
                row.style.transition = 'none';
            }
        }, { passive: false });
        
        row.addEventListener('touchend', function() {
            if (!isSwiping) return;
            
            const deltaX = touchCurrentX - touchStartX;
            
            // Reset transform dengan animasi
            row.style.transition = 'transform 0.3s ease';
            row.style.transform = 'translateX(0)';
            
            // Jika swipe cukup jauh, trigger action
            if (Math.abs(deltaX) > 100) {
                if (deltaX > 0) {
                    // Swipe kanan - edit
                    const editBtn = row.querySelector('.action-btn.edit');
                    if (editBtn) editBtn.click();
                } else {
                    // Swipe kiri - delete
                    const deleteBtn = row.querySelector('.action-btn.delete');
                    if (deleteBtn) deleteBtn.click();
                }
            }
            
            touchStartX = 0;
            touchStartY = 0;
            isSwiping = false;
        });
    });
}

/**
 * Setup double tap untuk edit cepat
 */
function setupDoubleTapEdit() {
    let lastTap = 0;
    
    document.addEventListener('touchend', function(e) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 300 && tapLength > 0) {
            // Double tap detected
            const target = e.target;
            
            // Cari row terdekat
            const row = target.closest('tr') || target.closest('.mobile-trade-card');
            if (row) {
                e.preventDefault();
                const editBtn = row.querySelector('.action-btn.edit') || 
                               row.querySelector('[onclick*="editTrade"]');
                if (editBtn) {
                    editBtn.click();
                }
            }
        }
        
        lastTap = currentTime;
    });
}

/**
 * Setup long press untuk delete
 */
function setupLongPressDelete() {
    let pressTimer;
    
    document.addEventListener('touchstart', function(e) {
        const target = e.target;
        const row = target.closest('tr') || target.closest('.mobile-trade-card');
        
        if (row) {
            pressTimer = setTimeout(function() {
                // Long press detected
                const deleteBtn = row.querySelector('.action-btn.delete') || 
                                 row.querySelector('[onclick*="deleteTrade"]');
                if (deleteBtn) {
                    vibrate(); // Haptic feedback
                    deleteBtn.click();
                }
            }, 800); // 800ms untuk long press
        }
    });
    
    document.addEventListener('touchend', function() {
        clearTimeout(pressTimer);
    });
    
    document.addEventListener('touchmove', function() {
        clearTimeout(pressTimer);
    });
}

/**
 * Vibrate device (jika didukung)
 */
function vibrate() {
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

/**
 * Setup mobile bottom tab bar
 */
function setupMobileTabs() {
    if (window.innerWidth <= 768) {
        createMobileTabBar();
    }
    
    // Update tab bar pada resize
    window.addEventListener('resize', function() {
        const tabBar = document.querySelector('.mobile-tab-bar');
        if (window.innerWidth <= 768 && !tabBar) {
            createMobileTabBar();
        } else if (window.innerWidth > 768 && tabBar) {
            tabBar.remove();
        }
    });
}

/**
 * Buat mobile bottom tab bar
 */
function createMobileTabBar() {
    if (document.querySelector('.mobile-tab-bar')) return;
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    const tabBar = document.createElement('div');
    tabBar.className = 'mobile-tab-bar';
    tabBar.innerHTML = `
        <button class="tab-item ${currentPage === 'dashboard.html' ? 'active' : ''}" onclick="navigateTo('dashboard.html')">
            <i class="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
        </button>
        <button class="tab-item ${currentPage === 'journal.html' ? 'active' : ''}" onclick="navigateTo('journal.html')">
            <i class="fas fa-plus-circle"></i>
            <span>Trade Baru</span>
        </button>
        <button class="tab-item ${currentPage === 'history.html' ? 'active' : ''}" onclick="navigateTo('history.html')">
            <i class="fas fa-history"></i>
            <span>Riwayat</span>
        </button>
        <button class="tab-item" onclick="navigateTo('index.html')">
            <i class="fas fa-cog"></i>
            <span>Settings</span>
        </button>
    `;
    
    document.body.appendChild(tabBar);
    
    // Update body padding
    document.body.style.paddingBottom = '70px';
}

/**
 * Navigasi dengan animasi
 */
function navigateTo(url) {
    // Tambahkan animasi keluar
    document.body.classList.add('page-exit');
    
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

/**
 * Show page transition animation
 */
function showPageTransition(targetPage) {
    // Buat transition overlay
    const transition = document.createElement('div');
    transition.className = 'page-transition';
    transition.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--bg-primary);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    transition.innerHTML = `
        <div class="loading-spinner" style="width: 40px; height: 40px;"></div>
    `;
    
    document.body.appendChild(transition);
    
    // Redirect setelah animasi
    setTimeout(() => {
        window.location.href = targetPage;
    }, 500);
}

/**
 * Konversi tabel desktop ke mobile card view
 */
function convertTableToMobileView() {
    if (window.innerWidth > 640) return;
    
    const table = document.getElementById('historyTable');
    const tableBody = document.getElementById('historyTableBody');
    
    if (!table || !tableBody) return;
    
    // Sembunyikan tabel desktop
    table.classList.add('desktop-table');
    
    // Buat container untuk mobile view
    let mobileContainer = document.querySelector('.mobile-table-view');
    if (!mobileContainer) {
        mobileContainer = document.createElement('div');
        mobileContainer.className = 'mobile-table-view';
        table.parentNode.insertBefore(mobileContainer, table);
    }
    
    // Clear existing content
    mobileContainer.innerHTML = '';
    
    // Ambil data dari tabel
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 8) return;
        
        const tradeId = row.dataset.id;
        const symbol = cells[1].textContent;
        const date = cells[0].textContent;
        const direction = cells[2].querySelector('.preview-direction')?.textContent || '';
        const pl = cells[8].textContent;
        const plClass = cells[8].className.includes('success') ? 'success' : 
                       cells[8].className.includes('danger') ? 'danger' : '';
        const status = cells[10].querySelector('.status-badge')?.textContent || '';
        
        // Buat card untuk mobile
        const card = document.createElement('div');
        card.className = 'mobile-trade-card';
        card.innerHTML = `
            <div class="mobile-trade-header">
                <div class="mobile-trade-symbol">${symbol}</div>
                <div class="mobile-trade-direction ${direction.toLowerCase()}">${direction}</div>
            </div>
            <div class="mobile-trade-details">
                <div class="mobile-trade-row">
                    <span>Tanggal:</span>
                    <span>${date}</span>
                </div>
                <div class="mobile-trade-row">
                    <span>P/L:</span>
                    <span class="${plClass}">${pl}</span>
                </div>
                <div class="mobile-trade-row">
                    <span>Status:</span>
                    <span class="status-${status.toLowerCase()}">${status}</span>
                </div>
            </div>
            <div class="mobile-trade-actions">
                <button class="action-btn view" onclick="viewTrade('${tradeId}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" onclick="editTrade('${tradeId}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteTrade('${tradeId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        mobileContainer.appendChild(card);
    });
}

// Ekspor fungsi ke global scope
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.navigateTo = navigateTo;
window.convertTableToMobileView = convertTableToMobileView;

// Inisialisasi konversi tabel pada load dan resize
window.addEventListener('load', convertTableToMobileView);
window.addEventListener('resize', convertTableToMobileView);

console.log('✅ Mobile navigation ready');
