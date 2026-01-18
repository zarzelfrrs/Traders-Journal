/**
 * JOURNAL.JS
 * 
 * File ini menangani form input jurnal trading.
 * Semua logika untuk menghitung P/L, validasi form, dan penyimpanan data ada di sini.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Journal.js loaded');
    
    // Inisialisasi elemen DOM
    const journalForm = document.getElementById('journalForm');
    const tradeDateInput = document.getElementById('tradeDate');
    const symbolSelect = document.getElementById('symbol');
    const customSymbolInput = document.getElementById('customSymbol');
    const lotSizeInput = document.getElementById('lotSize');
    const entryPriceInput = document.getElementById('entryPrice');
    const stopLossInput = document.getElementById('stopLoss');
    const takeProfitInput = document.getElementById('takeProfit');
    const exitPriceInput = document.getElementById('exitPrice');
    const calculatePLButton = document.getElementById('calculatePL');
    const resetFormButton = document.getElementById('resetForm');
    const saveTemplateButton = document.getElementById('saveTemplate');
    
    // Element untuk display hasil kalkulasi
    const rrRatioSpan = document.getElementById('rrRatio');
    const slPipsSpan = document.getElementById('slPips');
    const tpPipsSpan = document.getElementById('tpPips');
    const plAmountSpan = document.getElementById('plAmount');
    
    // Set tanggal default ke hari ini
    const today = new Date().toISOString().split('T')[0];
    tradeDateInput.value = today;
    
    // Tampilkan input custom symbol jika "Lainnya" dipilih
    symbolSelect.addEventListener('change', function() {
        customSymbolInput.style.display = this.value === 'OTHER' ? 'block' : 'none';
        if (this.value !== 'OTHER') {
            customSymbolInput.value = '';
        }
    });
    
    /**
     * Fungsi untuk menghitung pips berdasarkan pair
     * Pair forex: 4 decimal (0.0001 = 1 pip)
     * Gold: 2 decimal (0.01 = 1 pip)
     * Crypto: bervariasi
     */
    function calculatePips(entry, exit, symbol) {
        let pipValue;
        
        // Tentukan pip value berdasarkan pair
        if (symbol.includes('XAU') || symbol.includes('GOLD')) {
            // Gold: 2 decimal places
            pipValue = 0.01;
        } else if (symbol.includes('BTC') || symbol.includes('ETH') || 
                   symbol.includes('BNB') || symbol.includes('XRP') || 
                   symbol.includes('ADA') || symbol.includes('CRYPTO')) {
            // Crypto: 2 decimal places umumnya
            pipValue = 0.01;
        } else {
            // Forex: 4 decimal places
            pipValue = 0.0001;
        }
        
        const pips = Math.abs(exit - entry) / pipValue;
        return Math.round(pips * 100) / 100; // Bulatkan 2 decimal
    }
    
    /**
     * Fungsi untuk menghitung profit/loss
     * Formula: (Exit - Entry) * Lot Size * Pip Value * 10
     * Untuk Gold: 1 lot = 100 ounce
     * Untuk Forex: 1 lot = 100,000 unit
     * Untuk Crypto: disesuaikan
     */
    function calculateProfitLoss(entry, exit, lotSize, direction, symbol) {
        // Tentukan contract size
        let contractSize;
        let pipValue;
        
        if (symbol.includes('XAU') || symbol.includes('GOLD')) {
            // Gold: 1 lot = 100 ounce, 1 pip = $0.01
            contractSize = 100;
            pipValue = 0.01;
        } else if (symbol.includes('BTC') || symbol.includes('CRYPTO')) {
            // Crypto: disederhanakan
            contractSize = 1;
            pipValue = 1;
        } else {
            // Forex: 1 lot = 100,000 unit, 1 pip = $10
            contractSize = 100000;
            pipValue = 0.0001;
        }
        
        // Hitung profit
        let profit;
        if (direction === 'BUY') {
            profit = (exit - entry) * contractSize * lotSize;
        } else {
            profit = (entry - exit) * contractSize * lotSize;
        }
        
        // Untuk forex, konversi ke USD
        if (!symbol.includes('XAU') && !symbol.includes('CRYPTO')) {
            profit = profit / pipValue * 10; // 1 pip = $10 untuk 1 lot standard
        }
        
        return Math.round(profit * 100) / 100;
    }
    
    /**
     * Update display kalkulasi P/L
     */
    function updatePLDisplay() {
        try {
            // Ambil nilai dari form
            const symbol = symbolSelect.value === 'OTHER' 
                ? customSymbolInput.value 
                : symbolSelect.value;
            const entry = parseFloat(entryPriceInput.value);
            const stopLoss = parseFloat(stopLossInput.value);
            const takeProfit = parseFloat(takeProfitInput.value);
            const exit = exitPriceInput.value ? parseFloat(exitPriceInput.value) : null;
            const lotSize = parseFloat(lotSizeInput.value);
            const direction = document.getElementById('direction').value;
            
            // Validasi input
            if (!symbol || !entry || !stopLoss || !takeProfit || !lotSize) {
                throw new Error('Harap isi semua field yang diperlukan');
            }
            
            // Hitung pips
            const slPips = calculatePips(entry, stopLoss, symbol);
            const tpPips = calculatePips(entry, takeProfit, symbol);
            
            // Hitung RR Ratio
            const rrRatio = tpPips / slPips;
            
            // Update display
            rrRatioSpan.textContent = rrRatio.toFixed(2) + ':1';
            slPipsSpan.textContent = slPips;
            tpPipsSpan.textContent = tpPips;
            
            // Hitung P/L jika exit price diisi
            if (exit) {
                const profitLoss = calculateProfitLoss(entry, exit, lotSize, direction, symbol);
                plAmountSpan.textContent = `$${profitLoss.toFixed(2)}`;
                plAmountSpan.className = profitLoss >= 0 ? 'text-success' : 'text-danger';
            } else {
                plAmountSpan.textContent = '$0.00';
                plAmountSpan.className = '';
            }
            
        } catch (error) {
            console.warn('⚠️', error.message);
            // Reset display jika error
            rrRatioSpan.textContent = '1:1';
            slPipsSpan.textContent = '0';
            tpPipsSpan.textContent = '0';
            plAmountSpan.textContent = '$0.00';
            plAmountSpan.className = '';
        }
    }
    
    /**
     * Event listener untuk kalkulasi real-time
     */
    [entryPriceInput, stopLossInput, takeProfitInput, exitPriceInput, lotSizeInput].forEach(input => {
        input.addEventListener('input', updatePLDisplay);
    });
    
    document.getElementById('direction').addEventListener('change', updatePLDisplay);
    symbolSelect.addEventListener('change', updatePLDisplay);
    customSymbolInput.addEventListener('input', updatePLDisplay);
    
    // Tombol kalkulasi manual
    calculatePLButton.addEventListener('click', updatePLDisplay);
    
    /**
     * Reset form ke keadaan awal
     */
    resetFormButton.addEventListener('click', function() {
        if (confirm('Reset form? Semua input akan dikosongkan.')) {
            journalForm.reset();
            tradeDateInput.value = today;
            customSymbolInput.style.display = 'none';
            customSymbolInput.value = '';
            updatePLDisplay();
            
            // Reset checkbox emosi
            document.querySelectorAll('input[name="emotion"]').forEach(cb => {
                cb.checked = false;
            });
            
            showNotification('Form telah direset', 'success');
        }
    });
    
    /**
     * Simpan sebagai template
     */
    saveTemplateButton.addEventListener('click', function() {
        // Ambil data dari form (kecuali tanggal dan catatan)
        const template = {
            symbol: symbolSelect.value,
            customSymbol: customSymbolInput.value,
            timeframe: document.getElementById('timeframe').value,
            direction: document.getElementById('direction').value,
            lotSize: lotSizeInput.value,
            stopLoss: stopLossInput.value,
            takeProfit: takeProfitInput.value,
            savedAt: new Date().toISOString()
        };
        
        // Simpan ke localStorage
        try {
            const templates = JSON.parse(localStorage.getItem('trading_templates') || '[]');
            templates.push(template);
            localStorage.setItem('trading_templates', JSON.stringify(templates));
            
            showNotification('Template berhasil disimpan!', 'success');
        } catch (error) {
            console.error('Error menyimpan template:', error);
            showNotification('Gagal menyimpan template', 'error');
        }
    });
    
    /**
     * Handle form submission
     */
    journalForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            // Ambil data dari form
            const tradeData = {
                tradeDate: tradeDateInput.value,
                symbol: symbolSelect.value === 'OTHER' ? customSymbolInput.value : symbolSelect.value,
                timeframe: document.getElementById('timeframe').value,
                direction: document.getElementById('direction').value,
                lotSize: parseFloat(lotSizeInput.value),
                entryPrice: parseFloat(entryPriceInput.value),
                stopLoss: parseFloat(stopLossInput.value),
                takeProfit: parseFloat(takeProfitInput.value),
                exitPrice: exitPriceInput.value ? parseFloat(exitPriceInput.value) : null,
                notes: document.getElementById('notes').value,
                screenshot: document.getElementById('screenshot').value,
                emotions: Array.from(document.querySelectorAll('input[name="emotion"]:checked'))
                    .map(cb => cb.value)
            };
            
            // Hitung P/L jika ada exit price
            if (tradeData.exitPrice) {
                tradeData.profitLoss = calculateProfitLoss(
                    tradeData.entryPrice,
                    tradeData.exitPrice,
                    tradeData.lotSize,
                    tradeData.direction,
                    tradeData.symbol
                );
                
                // Hitung pips dan RR
                const slPips = calculatePips(tradeData.entryPrice, tradeData.stopLoss, tradeData.symbol);
                const tpPips = calculatePips(tradeData.entryPrice, tradeData.takeProfit, tradeData.symbol);
                tradeData.rrRatio = (tpPips / slPips).toFixed(2);
                tradeData.slPips = slPips;
                tradeData.tpPips = tpPips;
            }
            
            // Validasi data
            if (!tradeData.symbol) {
                throw new Error('Harap pilih atau masukkan pair trading');
            }
            
            if (tradeData.entryPrice <= 0 || tradeData.lotSize <= 0) {
                throw new Error('Entry price dan lot size harus lebih dari 0');
            }
            
            // Simpan ke storage
            const savedTrade = await Storage.saveTrade(tradeData);
            
            // Tampilkan notifikasi sukses
            showNotification(
                `Trade ${tradeData.symbol} ${tradeData.direction} berhasil disimpan!`,
                'success'
            );
            
            // Reset form setelah simpan
            journalForm.reset();
            tradeDateInput.value = today;
            customSymbolInput.style.display = 'none';
            updatePLDisplay();
            
            // Update preview recent trades
            loadRecentTradesPreview();
            
        } catch (error) {
            console.error('Error menyimpan trade:', error);
            showNotification(`Gagal menyimpan: ${error.message}`, 'error');
        }
    });
    
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
    
    /**
     * Load recent trades untuk preview
     */
    function loadRecentTradesPreview() {
        const recentTrades = Storage.getAllTrades()
            .sort((a, b) => new Date(b.tradeDate) - new Date(a.tradeDate))
            .slice(0, 3);
        
        const previewGrid = document.getElementById('recentPreview');
        
        if (recentTrades.length === 0) {
            previewGrid.innerHTML = `
                <div class="preview-card">
                    <p class="text-muted">Belum ada data trading</p>
                    <p>Mulai catat trade pertama Anda!</p>
                </div>
            `;
            return;
        }
        
        previewGrid.innerHTML = recentTrades.map(trade => `
            <div class="preview-card">
                <div class="preview-header">
                    <span class="preview-symbol">${trade.symbol}</span>
                    <span class="preview-direction ${trade.direction.toLowerCase()}">
                        ${trade.direction}
                    </span>
                </div>
                <div class="preview-details">
                    <div class="preview-row">
                        <span>Entry:</span>
                        <span>${trade.entryPrice}</span>
                    </div>
                    ${trade.exitPrice ? `
                        <div class="preview-row">
                            <span>Exit:</span>
                            <span>${trade.exitPrice}</span>
                        </div>
                        <div class="preview-row">
                            <span>P/L:</span>
                            <span class="${trade.profitLoss >= 0 ? 'text-success' : 'text-danger'}">
                                $${trade.profitLoss ? trade.profitLoss.toFixed(2) : '0.00'}
                            </span>
                        </div>
                    ` : `
                        <div class="preview-row">
                            <span>Status:</span>
                            <span class="status-open">OPEN</span>
                        </div>
                    `}
                </div>
                <div class="preview-footer">
                    <small>${trade.tradeDate} • ${trade.timeframe}</small>
                </div>
            </div>
        `).join('');
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
    
    // Inisialisasi
    updatePLDisplay();
    loadRecentTradesPreview();
    loadUserData();
    
    // Tambahkan style untuk notifikasi
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: var(--bg-card);
            border-left: 4px solid var(--primary);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        }
        
        .notification-success {
            border-left-color: var(--success);
        }
        
        .notification-error {
            border-left-color: var(--danger);
        }
        
        .notification i {
            font-size: 1.25rem;
        }
        
        .notification-success i {
            color: var(--success);
        }
        
        .notification-error i {
            color: var(--danger);
        }
        
        .notification-close {
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 1.5rem;
            cursor: pointer;
            margin-left: auto;
        }
        
        .fade-out {
            animation: slideOut 0.3s ease forwards;
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
        
        @keyframes slideOut {
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .preview-card {
            background: var(--bg-primary);
            border-radius: var(--border-radius);
            padding: var(--spacing-md);
            border: 1px solid var(--border-color);
        }
        
        .preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .preview-symbol {
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        .preview-direction {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .preview-direction.buy {
            background: rgba(16, 185, 129, 0.2);
            color: var(--success);
        }
        
        .preview-direction.sell {
            background: rgba(239, 68, 68, 0.2);
            color: var(--danger);
        }
        
        .preview-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.25rem;
        }
        
        .preview-footer {
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            border-top: 1px solid var(--border-color);
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Journal.js initialized successfully');
});