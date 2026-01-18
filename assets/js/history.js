/**
 * HISTORY.JS
 * 
 * File ini menangani halaman riwayat trading.
 * Semua fitur filter, pagination, edit, dan delete ada di sini.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📜 History.js loaded');
    
    // Inisialisasi variabel
    let currentPage = 1;
    const itemsPerPage = 10;
    let currentFilters = {};
    let allTrades = [];
    
    // Load data awal
    loadHistoryData();
    setupEventListeners();
    loadUserData();
    
    /**
     * Load semua data trading
     */
    function loadHistoryData() {
        allTrades = Storage.getAllTrades();
        updateSummaryStats();
        populateFilterOptions();
        applyFilters();
    }
    
    /**
     * Update summary statistics
     */
    function updateSummaryStats() {
        const stats = Storage.getTradingStats();
        
        document.getElementById('totalTrades').textContent = stats.totalTrades;
        document.getElementById('winRate').textContent = `${stats.winRate}%`;
        document.getElementById('totalProfit').textContent = formatCurrency(stats.totalProfit);
        document.getElementById('avgRR').textContent = stats.avgRR;
    }
    
    /**
     * Populate filter options dengan data unik
     */
    function populateFilterOptions() {
        const pairSelect = document.getElementById('filterPair');
        if (!pairSelect) return;
        
        // Dapatkan semua pair unik
        const uniquePairs = [...new Set(allTrades.map(trade => trade.symbol))];
        
        // Simpan current value
        const currentValue = pairSelect.value;
        
        // Clear existing options kecuali "Semua Pair"
        pairSelect.innerHTML = '<option value="">Semua Pair</option>';
        
        // Tambahkan options
        uniquePairs.sort().forEach(pair => {
            const option = document.createElement('option');
            option.value = pair;
            option.textContent = pair;
            pairSelect.appendChild(option);
        });
        
        // Restore previous selection
        pairSelect.value = currentValue;
    }
    
    /**
     * Setup semua event listeners
     */
    function setupEventListeners() {
        // Filter buttons
        document.getElementById('applyFilters')?.addEventListener('click', applyFilters);
        document.getElementById('resetFilters')?.addEventListener('click', resetFilters);
        document.getElementById('exportData')?.addEventListener('click', exportData);
        document.getElementById('deleteAllData')?.addEventListener('click', deleteAllData);
        
        // Pagination
        document.getElementById('prevPage')?.addEventListener('click', goToPrevPage);
        document.getElementById('nextPage')?.addEventListener('click', goToNextPage);
        
        // Modal
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Close modal ketika klik di luar
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('tradeModal');
            if (modal && event.target === modal) {
                closeModal();
            }
        });
    }
    
    /**
     * Apply filters yang dipilih
     */
    function applyFilters() {
        try {
            // Collect filter values
            currentFilters = {
                pair: document.getElementById('filterPair').value,
                direction: document.getElementById('filterDirection').value,
                result: document.getElementById('filterResult').value,
                date: document.getElementById('filterDate').value
            };
            
            // Filter data
            const filteredTrades = Storage.getFilteredTrades(currentFilters);
            
            // Update table
            renderTable(filteredTrades);
            
            // Reset ke halaman 1
            currentPage = 1;
            updatePagination(filteredTrades.length);
            
            console.log('✅ Filters applied:', currentFilters);
            
        } catch (error) {
            console.error('❌ Error applying filters:', error);
            showNotification('Gagal menerapkan filter', 'error');
        }
    }
    
    /**
     * Reset semua filter
     */
    function resetFilters() {
        document.getElementById('filterPair').value = '';
        document.getElementById('filterDirection').value = '';
        document.getElementById('filterResult').value = '';
        document.getElementById('filterDate').value = '';
        
        currentFilters = {};
        applyFilters();
        showNotification('Filter telah direset', 'success');
    }
    
    /**
     * Render table dengan data
     */
    function renderTable(trades) {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;
        
        if (trades.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="text-center text-muted">
                        <i class="fas fa-database"></i>
                        <p>Tidak ada data trading yang ditemukan</p>
                        <small>Coba ubah filter atau <a href="journal.html">buat trade baru</a></small>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Hitung pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageTrades = trades.slice(startIndex, endIndex);
        
        // Render rows
        tbody.innerHTML = pageTrades.map(trade => {
            const status = trade.exitPrice 
                ? (trade.profitLoss > 0 ? 'WIN' : 'LOSS')
                : 'OPEN';
            
            const statusClass = status === 'WIN' ? 'status-win' : 
                               status === 'LOSS' ? 'status-loss' : 'status-open';
            
            const plAmount = trade.profitLoss 
                ? `$${Math.abs(trade.profitLoss).toFixed(2)}`
                : '-';
            
            const plClass = trade.profitLoss > 0 ? 'text-success' : 
                           trade.profitLoss < 0 ? 'text-danger' : '';
            
            return `
                <tr data-id="${trade.id}">
                    <td>${formatDate(trade.tradeDate)}</td>
                    <td><strong>${trade.symbol}</strong></td>
                    <td>
                        <span class="preview-direction ${trade.direction.toLowerCase()}">
                            ${trade.direction}
                        </span>
                    </td>
                    <td>${trade.entryPrice}</td>
                    <td>${trade.stopLoss}</td>
                    <td>${trade.takeProfit}</td>
                    <td>${trade.exitPrice || '-'}</td>
                    <td>${trade.lotSize}</td>
                    <td class="${plClass}">${plAmount}</td>
                    <td>${trade.rrRatio || '-'}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                    <td>
                        <div class="action-buttons">
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
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    /**
     * Update pagination controls
     */
    function updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (pageInfo) {
            pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentPage === totalPages || totalPages === 0;
        }
    }
    
    /**
     * Navigasi ke halaman sebelumnya
     */
    function goToPrevPage() {
        if (currentPage > 1) {
            currentPage--;
            applyFilters();
        }
    }
    
    /**
     * Navigasi ke halaman berikutnya
     */
    function goToNextPage() {
        const totalItems = Storage.getFilteredTrades(currentFilters).length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (currentPage < totalPages) {
            currentPage++;
            applyFilters();
        }
    }
    
    /**
     * View trade details in modal
     */
    window.viewTrade = function(tradeId) {
        const trade = Storage.getTradeById(tradeId);
        if (!trade) return;
        
        const modal = document.getElementById('tradeModal');
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');
        
        if (!modal || !modalBody) return;
        
        // Set modal title
        modalTitle.textContent = `${trade.symbol} ${trade.direction} - ${formatDate(trade.tradeDate)}`;
        
        // Build modal content
        modalBody.innerHTML = `
            <div class="trade-details">
                <div class="detail-row">
                    <span class="detail-label">Pair:</span>
                    <span class="detail-value">${trade.symbol}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Timeframe:</span>
                    <span class="detail-value">${trade.timeframe}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Direction:</span>
                    <span class="detail-value ${trade.direction.toLowerCase()}">${trade.direction}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Lot Size:</span>
                    <span class="detail-value">${trade.lotSize}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Entry Price:</span>
                    <span class="detail-value">${trade.entryPrice}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Stop Loss:</span>
                    <span class="detail-value">${trade.stopLoss}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Take Profit:</span>
                    <span class="detail-value">${trade.takeProfit}</span>
                </div>
                ${trade.exitPrice ? `
                    <div class="detail-row">
                        <span class="detail-label">Exit Price:</span>
                        <span class="detail-value">${trade.exitPrice}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Profit/Loss:</span>
                        <span class="detail-value ${trade.profitLoss >= 0 ? 'text-success' : 'text-danger'}">
                            $${trade.profitLoss ? trade.profitLoss.toFixed(2) : '0.00'}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">RR Ratio:</span>
                        <span class="detail-value">${trade.rrRatio || '-'}</span>
                    </div>
                ` : ''}
                ${trade.emotions && trade.emotions.length > 0 ? `
                    <div class="detail-row">
                        <span class="detail-label">Emosi:</span>
                        <span class="detail-value">${trade.emotions.join(', ')}</span>
                    </div>
                ` : ''}
                ${trade.notes ? `
                    <div class="detail-row">
                        <span class="detail-label">Catatan:</span>
                        <div class="detail-value notes">${trade.notes}</div>
                    </div>
                ` : ''}
                ${trade.screenshot ? `
                    <div class="detail-row">
                        <span class="detail-label">Screenshot:</span>
                        <a href="${trade.screenshot}" target="_blank" class="detail-value">
                            Lihat Gambar
                        </a>
                    </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">Dibuat:</span>
                    <span class="detail-value">${formatDateTime(trade.createdAt)}</span>
                </div>
                ${trade.updatedAt ? `
                    <div class="detail-row">
                        <span class="detail-label">Terakhir diupdate:</span>
                        <span class="detail-value">${formatDateTime(trade.updatedAt)}</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Setup modal buttons
        const editBtn = document.getElementById('editTrade');
        const deleteBtn = document.getElementById('deleteTrade');
        
        if (editBtn) {
            editBtn.onclick = function() {
                closeModal();
                editTrade(tradeId);
            };
        }
        
        if (deleteBtn) {
            deleteBtn.onclick = function() {
                if (confirm('Yakin ingin menghapus trade ini?')) {
                    deleteTrade(tradeId);
                    closeModal();
                }
            };
        }
        
        // Show modal
        modal.classList.add('show');
    };
    
    /**
     * Edit trade (redirect ke journal dengan data)
     */
    window.editTrade = function(tradeId) {
        // Simpan trade ID di sessionStorage untuk di-load di journal page
        sessionStorage.setItem('editTradeId', tradeId);
        
        // Redirect ke journal page
        window.location.href = 'journal.html';
    };
    
    /**
     * Delete trade
     */
    window.deleteTrade = async function(tradeId) {
        try {
            if (!confirm('Yakin ingin menghapus trade ini?')) {
                return;
            }
            
            await Storage.deleteTrade(tradeId);
            
            // Reload data
            loadHistoryData();
            
            showNotification('Trade berhasil dihapus', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting trade:', error);
            showNotification('Gagal menghapus trade', 'error');
        }
    };
    
    /**
     * Export data ke CSV
     */
    function exportData() {
        try {
            const csvContent = Storage.exportToCSV();
            
            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = `trading-journal-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            showNotification('Data berhasil diekspor ke CSV', 'success');
            
        } catch (error) {
            console.error('❌ Error exporting data:', error);
            showNotification(`Gagal mengekspor: ${error.message}`, 'error');
        }
    }
    
    /**
     * Delete semua data
     */
    async function deleteAllData() {
        try {
            const confirmed = await Storage.deleteAllTrades();
            
            if (confirmed) {
                // Reload data
                loadHistoryData();
                showNotification('Semua data berhasil dihapus', 'success');
            }
            
        } catch (error) {
            console.error('❌ Error deleting all data:', error);
            showNotification('Gagal menghapus data', 'error');
        }
    }
    
    /**
     * Close modal
     */
    function closeModal() {
        const modal = document.getElementById('tradeModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    /**
     * Format currency
     */
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    }
    
    /**
     * Format date
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    /**
     * Format date time
     */
    function formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    /**
     * Load data user untuk navbar
     */
    function loadUserData() {
        const userData = Storage.getUserData();
        if (userData && userData.username) {
            const userElement = document.getElementById('currentUser');
            if (userElement) {
                userElement.textContent = userData.username;
            }
        }
    }
    
    /**
     * Handle logout
     */
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Yakin ingin logout?')) {
                window.location.href = 'index.html';
            }
        });
    }
    
    /**
     * Fungsi untuk menampilkan notifikasi
     */
    function showNotification(message, type = 'info') {
        // Buat element notifikasi
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Tambahkan ke body
        document.body.appendChild(notification);
        
        // Auto remove setelah 5 detik
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        });
    }
    
    // Tambahkan style untuk modal dan details
    const style = document.createElement('style');
    style.textContent = `
        .trade-details {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .detail-row {
            display: flex;
            border-bottom: 1px solid var(--border-color);
            padding: 0.5rem 0;
        }
        
        .detail-row:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            width: 180px;
            font-weight: 500;
            color: var(--text-secondary);
        }
        
        .detail-value {
            flex: 1;
            color: var(--text-primary);
        }
        
        .detail-value.notes {
            white-space: pre-wrap;
            background: var(--bg-primary);
            padding: 0.75rem;
            border-radius: var(--border-radius);
            margin-top: 0.5rem;
        }
        
        .action-buttons {
            display: flex;
            gap: 0.5rem;
        }
        
        .action-btn {
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .action-btn:hover {
            transform: translateY(-2px);
        }
        
        .action-btn.view {
            background: var(--info);
            color: white;
        }
        
        .action-btn.edit {
            background: var(--warning);
            color: white;
        }
        
        .action-btn.delete {
            background: var(--danger);
            color: white;
        }
        
        .no-data {
            text-align: center;
            padding: 3rem 1rem;
            color: var(--text-muted);
        }
        
        .no-data i {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.5;
        }
        
        .text-center {
            text-align: center;
        }
        
        .text-muted {
            color: var(--text-muted);
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ History.js initialized successfully');
});