/**
 * HISTORY.JS - History Page Logic
 * 
 * File ini menangani halaman riwayat trading.
 */

// Global variables for history page
let currentView = 'list'; // 'list' or 'grid'
let currentSort = 'date-desc';
let currentFilters = {};
let currentPage = 1;
const itemsPerPage = 10;
let allTrades = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('📜 History page initialized');
    
    // Load data
    loadHistoryData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check for trade ID in URL
    checkUrlForTrade();
});

function loadHistoryData() {
    // Get all trades
    allTrades = Storage.getTrades();
    
    // Update summary stats
    updateSummaryStats();
    
    // Populate filter options
    populateFilterOptions();
    
    // Apply filters and render
    applyFilters();
}

function updateSummaryStats() {
    const stats = Storage.calculateStats();
    
    document.getElementById('totalCount').textContent = stats.total;
    document.getElementById('winRateStat').textContent = `${stats.winRate}%`;
    document.getElementById('totalProfitStat').textContent = App.formatCurrency(stats.totalProfit);
    document.getElementById('avgRRStat').textContent = stats.avgRR;
    
    // Update sidebar
    const totalTradesSidebar = document.getElementById('totalTradesSidebar');
    if (totalTradesSidebar) {
        totalTradesSidebar.textContent = stats.total;
    }
}

function populateFilterOptions() {
    const symbolSelect = document.getElementById('filterSymbol');
    if (!symbolSelect) return;
    
    // Get unique symbols
    const uniqueSymbols = [...new Set(allTrades.map(trade => trade.symbol))].sort();
    
    // Clear existing options except first one
    symbolSelect.innerHTML = '<option value="">Semua Pair</option>';
    
    // Add options
    uniqueSymbols.forEach(symbol => {
        const option = document.createElement('option');
        option.value = symbol;
        option.textContent = symbol;
        symbolSelect.appendChild(option);
    });
}

function applyFilters() {
    try {
        // Collect filter values
        currentFilters = {
            symbol: document.getElementById('filterSymbol')?.value || '',
            direction: document.getElementById('filterDirection')?.value || '',
            result: document.getElementById('filterResult')?.value || '',
            date: document.getElementById('filterDate')?.value || '',
            timeframe: document.getElementById('filterTimeframe')?.value || '',
            sortBy: currentSort
        };
        
        // Filter trades
        const filteredTrades = Storage.getFilteredTrades(currentFilters);
        
        // Reset to page 1
        currentPage = 1;
        
        // Render based on current view
        if (currentView === 'list') {
            renderDesktopTable(filteredTrades);
        } else {
            renderMobileCards(filteredTrades);
        }
        
        // Update empty state
        updateEmptyState(filteredTrades.length);
        
        // Update pagination
        updatePagination(filteredTrades.length);
        
    } catch (error) {
        console.error('Error applying filters:', error);
        App.showNotification('Gagal menerapkan filter', 'error');
    }
}

function renderDesktopTable(trades) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTrades = trades.slice(startIndex, endIndex);
    
    if (pageTrades.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-database"></i>
                        <p>Tidak ada data trading yang ditemukan</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = pageTrades.map(trade => {
        const status = trade.exitPrice ? 
            (trade.profitLoss > 0 ? 'WIN' : 'LOSS') : 'OPEN';
        
        const statusClass = status === 'WIN' ? 'text-success' : 
                           status === 'LOSS' ? 'text-danger' : 'text-info';
        
        return `
            <tr data-id="${trade.id}">
                <td>${App.formatDateShort(trade.tradeDate)}</td>
                <td><strong>${trade.symbol}</strong></td>
                <td>${trade.timeframe}</td>
                <td>
                    <span class="trade-direction ${trade.direction.toLowerCase()}">
                        ${trade.direction}
                    </span>
                </td>
                <td>${trade.entryPrice}</td>
                <td>${trade.exitPrice || '-'}</td>
                <td>${trade.lotSize}</td>
                <td class="${statusClass}">
                    ${trade.exitPrice ? App.formatCurrency(trade.profitLoss) : 'OPEN'}
                </td>
                <td class="action-cell">
                    <button class="action-btn view" onclick="viewTrade('${trade.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editTrade('${trade.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteTrade('${trade.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderMobileCards(trades) {
    const container = document.getElementById('mobileCards');
    if (!container) return;
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTrades = trades.slice(startIndex, endIndex);
    
    if (pageTrades.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-database"></i>
                <p>Tidak ada data trading yang ditemukan</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pageTrades.map(trade => {
        const status = trade.exitPrice ? 
            (trade.profitLoss > 0 ? 'WIN' : 'LOSS') : 'OPEN';
        
        const statusClass = status === 'WIN' ? 'text-success' : 
                           status === 'LOSS' ? 'text-danger' : 'text-info';
        
        return `
            <div class="mobile-card" data-id="${trade.id}">
                <div class="card-header">
                    <div class="card-symbol">${trade.symbol}</div>
                    <div class="card-direction ${trade.direction.toLowerCase()}">
                        ${trade.direction}
                    </div>
                </div>
                
                <div class="card-details">
                    <div class="card-detail">
                        <div class="detail-label">Tanggal</div>
                        <div class="detail-value">${App.formatDateShort(trade.tradeDate)}</div>
                    </div>
                    <div class="card-detail">
                        <div class="detail-label">Timeframe</div>
                        <div class="detail-value">${trade.timeframe}</div>
                    </div>
                    <div class="card-detail">
                        <div class="detail-label">Entry</div>
                        <div class="detail-value">${trade.entryPrice}</div>
                    </div>
                    <div class="card-detail">
                        <div class="detail-label">Exit</div>
                        <div class="detail-value">${trade.exitPrice || '-'}</div>
                    </div>
                    <div class="card-detail">
                        <div class="detail-label">Lot</div>
                        <div class="detail-value">${trade.lotSize}</div>
                    </div>
                    <div class="card-detail">
                        <div class="detail-label">P/L</div>
                        <div class="detail-value ${statusClass}">
                            ${trade.exitPrice ? App.formatCurrency(trade.profitLoss) : 'OPEN'}
                        </div>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="action-btn view" onclick="viewTrade('${trade.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editTrade('${trade.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteTrade('${trade.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateEmptyState(tradeCount) {
    const emptyState = document.getElementById('emptyState');
    if (!emptyState) return;
    
    if (tradeCount === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pageInfo = document.querySelector('.load-more');
    
    if (!pageInfo) return;
    
    if (totalPages <= 1 || currentPage >= totalPages) {
        pageInfo.innerHTML = '';
        return;
    }
    
    pageInfo.innerHTML = `
        <button class="btn-secondary" id="loadMoreBtn">
            <i class="fas fa-spinner fa-spin hidden"></i>
            <span>Muat lebih banyak (${currentPage}/${totalPages})</span>
        </button>
    `;
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreTrades);
    }
}

function loadMoreTrades() {
    currentPage++;
    const filteredTrades = Storage.getFilteredTrades(currentFilters);
    
    if (currentView === 'list') {
        loadMoreDesktopTable(filteredTrades);
    } else {
        loadMoreMobileCards(filteredTrades);
    }
    
    updatePagination(filteredTrades.length);
}

function loadMoreDesktopTable(trades) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTrades = trades.slice(startIndex, endIndex);
    
    if (pageTrades.length === 0) return;
    
    const newRows = pageTrades.map(trade => {
        const status = trade.exitPrice ? 
            (trade.profitLoss > 0 ? 'WIN' : 'LOSS') : 'OPEN';
        
        const statusClass = status === 'WIN' ? 'text-success' : 
                           status === 'LOSS' ? 'text-danger' : 'text-info';
        
        return `
            <tr data-id="${trade.id}">
                <td>${App.formatDateShort(trade.tradeDate)}</td>
                <td><strong>${trade.symbol}</strong></td>
                <td>${trade.timeframe}</td>
                <td>
                    <span class="trade-direction ${trade.direction.toLowerCase()}">
                        ${trade.direction}
                    </span>
                </td>
                <td>${trade.entryPrice}</td>
                <td>${trade.exitPrice || '-'}</td>
                <td>${trade.lotSize}</td>
                <td class="${statusClass}">
                    ${trade.exitPrice ? App.formatCurrency(trade.profitLoss) : 'OPEN'}
                </td>
                <td class="action-cell">
                    <button class="action-btn view" onclick="viewTrade('${trade.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editTrade('${trade.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteTrade('${trade.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.insertAdjacentHTML('beforeend', newRows);
}

function loadMoreMobileCards(trades) {
    const container = document.getElementById('mobileCards');
    if (!container) return;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTrades = trades.slice(startIndex, endIndex);
    
    if (pageTrades.length === 0) return;
    
    const newCards = pageTrades.map(trade => {
        const status = trade.exitPrice ? 
            (trade.profitLoss > 0 ? 'WIN' : 'LOSS') : 'OPEN';
        
        const statusClass = status === 'WIN' ? 'text-success' : 
                           status === 'LOSS' ? 'text-danger' : 'text-info';
        
        return `
            <div class="mobile-card" data-id="${trade.id}">
                <div class="card-header">
                    <div class="card-symbol">${trade.symbol}</div>
                    <div class="card-direction ${trade.direction.toLowerCase()}">
                        ${trade.direction}
                    </div>
                </div>
                
                <div class="card-details">
                    <div class="card-detail">
                        <div class="detail-label">Tanggal</div>
                        <div class="detail-value">${App.formatDateShort(trade.tradeDate)}</div>
                    </div>
                    <div class="card-detail">
                        <div class="detail-label">Timeframe</div>
                        <div class="detail-value">${trade.timeframe}</div>
                    </div>
                    <div class="card-detail">
                        <div class="detail-label">Entry</div>
                        <div class="detail-value">${trade.entryPrice}</div>
                    </div>
                    <div class="card-detail">
                        <div class="detail-label">Exit</div>
                        <div class="detail-value">${trade.exitPrice || '-'}</div>
                    </div>
                    <div class="card-detail">
                        <div class="detail-label">Lot</div>
                        <div class="detail-value">${trade.lotSize}</div>
                    </div>
                    <div class="card-detail">
                        <div class="detail-label">P/L</div>
                        <div class="detail-value ${statusClass}">
                            ${trade.exitPrice ? App.formatCurrency(trade.profitLoss) : 'OPEN'}
                        </div>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="action-btn view" onclick="viewTrade('${trade.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editTrade('${trade.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteTrade('${trade.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.insertAdjacentHTML('beforeend', newCards);
}

function viewTrade(tradeId) {
    const trade = Storage.getTradeById(tradeId);
    if (!trade) {
        App.showNotification('Trade tidak ditemukan', 'error');
        return;
    }
    
    // Build modal content
    const modalBody = document.getElementById('modalBody');
    const modalTitle = document.getElementById('modalTitle');
    
    if (!modalBody || !modalTitle) return;
    
    modalTitle.textContent = `${trade.symbol} ${trade.direction} - ${App.formatDateShort(trade.tradeDate)}`;
    
    const status = trade.exitPrice ? 
        (trade.profitLoss > 0 ? 'WIN' : 'LOSS') : 'OPEN';
    
    const statusClass = status === 'WIN' ? 'success' : 
                       status === 'LOSS' ? 'danger' : 'info';
    
    modalBody.innerHTML = `
        <div class="trade-details-modal">
            <div class="detail-section">
                <h4><i class="fas fa-chart-bar"></i> Trading Data</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Pair:</span>
                        <span class="detail-value">${trade.symbol}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Timeframe:</span>
                        <span class="detail-value">${trade.timeframe}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Direction:</span>
                        <span class="detail-value ${trade.direction.toLowerCase()}">${trade.direction}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Lot Size:</span>
                        <span class="detail-value">${trade.lotSize}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-bullseye"></i> Prices</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Entry Price:</span>
                        <span class="detail-value">${trade.entryPrice}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Stop Loss:</span>
                        <span class="detail-value">${trade.stopLoss}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Take Profit:</span>
                        <span class="detail-value">${trade.takeProfit}</span>
                    </div>
                    ${trade.exitPrice ? `
                        <div class="detail-item">
                            <span class="detail-label">Exit Price:</span>
                            <span class="detail-value">${trade.exitPrice}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            ${trade.exitPrice ? `
                <div class="detail-section">
                    <h4><i class="fas fa-calculator"></i> Results</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Profit/Loss:</span>
                            <span class="detail-value ${trade.profitLoss >= 0 ? 'text-success' : 'text-danger'}">
                                ${App.formatCurrency(trade.profitLoss)}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">RR Ratio:</span>
                            <span class="detail-value">${trade.rrRatio || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Pips SL:</span>
                            <span class="detail-value">${trade.slPips || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Pips TP:</span>
                            <span class="detail-value">${trade.tpPips || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value status-${statusClass}">${status}</span>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            ${trade.emotions && trade.emotions.length > 0 ? `
                <div class="detail-section">
                    <h4><i class="fas fa-heart"></i> Emotions</h4>
                    <div class="emotions-list">
                        ${trade.emotions.map(emotion => `
                            <span class="emotion-tag">${emotion}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${trade.notes ? `
                <div class="detail-section">
                    <h4><i class="fas fa-sticky-note"></i> Notes</h4>
                    <div class="notes-content">
                        ${trade.notes}
                    </div>
                </div>
            ` : ''}
            
            ${trade.screenshot ? `
                <div class="detail-section">
                    <h4><i class="fas fa-camera"></i> Screenshot</h4>
                    <a href="${trade.screenshot}" target="_blank" class="screenshot-link">
                        <i class="fas fa-external-link-alt"></i> View Screenshot
                    </a>
                </div>
            ` : ''}
            
            <div class="detail-section">
                <h4><i class="fas fa-info-circle"></i> Metadata</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Created:</span>
                        <span class="detail-value">${App.formatDate(trade.createdAt)}</span>
                    </div>
                    ${trade.updatedAt ? `
                        <div class="detail-item">
                            <span class="detail-label">Last Updated:</span>
                            <span class="detail-value">${App.formatDate(trade.updatedAt)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Set modal button actions
    const editBtn = document.getElementById('editTradeBtn');
    const deleteBtn = document.getElementById('deleteTradeBtn');
    
    if (editBtn) {
        editBtn.onclick = function() {
            closeModal();
            editTrade(tradeId);
        };
    }
    
    if (deleteBtn) {
        deleteBtn.onclick = function() {
            closeModal();
            deleteTrade(tradeId);
        };
    }
    
    // Show modal
    showModal();
}

function editTrade(tradeId) {
    // Store trade ID in sessionStorage for journal page to load
    sessionStorage.setItem('editTradeId', tradeId);
    
    // Redirect to journal page
    window.location.href = 'journal.html';
}

function deleteTrade(tradeId) {
    App.confirmAction(
        'Hapus trade ini? Tindakan ini tidak dapat dibatalkan.',
        function() {
            try {
                Storage.deleteTrade(tradeId);
                
                // Reload history data
                loadHistoryData();
                
                App.showNotification('Trade berhasil dihapus', 'success');
                
            } catch (error) {
                App.showNotification('Gagal menghapus trade', 'error');
            }
        }
    );
}

function showModal() {
    const modal = document.getElementById('tradeModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('tradeModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function setupEventListeners() {
    // Filter toggle
    const filterToggle = document.getElementById('filterToggle');
    const filterPanel = document.getElementById('filterPanel');
    const filterClose = document.getElementById('filterClose');
    const tabFilter = document.getElementById('tabFilter');
    
    if (filterToggle && filterPanel) {
        filterToggle.addEventListener('click', function() {
            filterPanel.classList.add('active');
        });
    }
    
    if (filterClose && filterPanel) {
        filterClose.addEventListener('click', function() {
            filterPanel.classList.remove('active');
        });
    }
    
    if (tabFilter && filterPanel) {
        tabFilter.addEventListener('click', function(e) {
            e.preventDefault();
            filterPanel.classList.toggle('active');
        });
    }
    
    // Filter actions
    const applyFiltersBtn = document.getElementById('applyFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            filterPanel.classList.remove('active');
            applyFilters();
        });
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            // Reset all filter inputs
            document.getElementById('filterSymbol').value = '';
            document.getElementById('filterDirection').value = '';
            document.getElementById('filterResult').value = '';
            document.getElementById('filterDate').value = '';
            document.getElementById('filterTimeframe').value = '';
            
            // Apply empty filters
            currentFilters = {};
            applyFilters();
            
            App.showNotification('Filter telah direset', 'success');
        });
    }
    
    // View toggle
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            
            // Update active button
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Change view
            switchView(view);
        });
    });
    
    // Sort options
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            applyFilters();
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // Clear all button
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllData);
    }
    
    // Modal close
    const modalClose = document.getElementById('modalClose');
    const confirmCancel = document.getElementById('confirmCancel');
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (confirmCancel) {
        confirmCancel.addEventListener('click', closeConfirmModal);
    }
    
    // Close modal on background click
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('tradeModal');
        if (modal && e.target === modal) {
            closeModal();
        }
        
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal && e.target === confirmModal) {
            closeConfirmModal();
        }
    });
}

function switchView(view) {
    currentView = view;
    
    // Show/hide appropriate containers
    const desktopTable = document.querySelector('.desktop-table');
    const mobileCards = document.getElementById('mobileCards');
    
    if (view === 'list') {
        if (desktopTable) desktopTable.style.display = 'block';
        if (mobileCards) mobileCards.style.display = 'none';
    } else {
        if (desktopTable) desktopTable.style.display = 'none';
        if (mobileCards) mobileCards.style.display = 'flex';
    }
    
    // Re-render with current view
    applyFilters();
}

function exportData() {
    try {
        const csvContent = Storage.exportToCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `trading-journal-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        App.showNotification('Data berhasil diekspor ke CSV', 'success');
        
    } catch (error) {
        App.showNotification(`Gagal mengekspor: ${error.message}`, 'error');
    }
}

function clearAllData() {
    App.confirmAction(
        'Hapus SEMUA data trading? Tindakan ini tidak dapat dibatalkan.',
        function() {
            try {
                Storage.deleteAllTrades();
                loadHistoryData();
                
                App.showNotification('Semua data berhasil dihapus', 'success');
                
            } catch (error) {
                App.showNotification('Gagal menghapus data', 'error');
            }
        }
    );
}

function checkUrlForTrade() {
    const urlParams = new URLSearchParams(window.location.search);
    const tradeId = urlParams.get('trade');
    
    if (tradeId) {
        // Auto-open trade modal
        setTimeout(() => {
            viewTrade(tradeId);
        }, 500);
    }
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Initialize with list view on desktop, grid on mobile
if (App.isMobile) {
    currentView = 'grid';
    switchView('grid');
} else {
    switchView('list');
}

// Export functions
window.viewTrade = viewTrade;
window.editTrade = editTrade;
window.deleteTrade = deleteTrade;
window.closeModal = closeModal;
