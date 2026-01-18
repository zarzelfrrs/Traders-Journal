/**
 * STATS.JS
 * 
 * File ini menangani dashboard statistik dan perhitungan risk management.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Stats.js loaded');
    
    // Inisialisasi chart jika ada
    if (typeof window.initializeCharts === 'function') {
        window.initializeCharts();
    }
    
    // Load data statistik
    loadStats();
    loadRecentTrades();
    setupRiskCalculator();
    loadUserData();
    
    /**
     * Load dan tampilkan statistik trading
     */
    function loadStats() {
        const stats = Storage.getTradingStats();
        const statsGrid = document.getElementById('statsGrid');
        
        if (!statsGrid) return;
        
        // Format currency
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2
            }).format(amount);
        };
        
        // Tampilkan statistik dalam cards
        statsGrid.innerHTML = `
            <div class="stat-card">
                <h3>Total Trade</h3>
                <div class="stat-value">${stats.totalTrades}</div>
                <div class="stat-details">
                    <span>Closed: ${stats.closedTrades}</span>
                    <span>Open: ${stats.openTrades}</span>
                </div>
            </div>
            
            <div class="stat-card">
                <h3>Win Rate</h3>
                <div class="stat-value">${stats.winRate}%</div>
                <div class="stat-details">
                    <span>Wins: ${stats.totalWins}</span>
                    <span>Losses: ${stats.totalLosses}</span>
                </div>
            </div>
            
            <div class="stat-card">
                <h3>Total Profit</h3>
                <div class="stat-value ${stats.totalProfit >= 0 ? 'text-success' : 'text-danger'}">
                    ${formatCurrency(stats.totalProfit)}
                </div>
                <div class="stat-change ${stats.monthlyProfit >= 0 ? 'positive' : 'negative'}">
                    This month: ${formatCurrency(stats.monthlyProfit)}
                </div>
            </div>
            
            <div class="stat-card">
                <h3>Avg Risk/Reward</h3>
                <div class="stat-value">${stats.avgRR}:1</div>
                <div class="stat-details">
                    <span>Best Trade: ${formatCurrency(stats.bestTrade)}</span>
                    <span>Worst Trade: ${formatCurrency(stats.worstTrade)}</span>
                </div>
            </div>
            
            <div class="stat-card">
                <h3>Consecutive</h3>
                <div class="stat-value">${stats.consecutiveWins}W / ${stats.consecutiveLosses}L</div>
                <div class="stat-details">
                    <span>Max Wins: ${stats.consecutiveWins}</span>
                    <span>Max Losses: ${stats.consecutiveLosses}</span>
                </div>
            </div>
            
            <div class="stat-card">
                <h3>Pairs Performance</h3>
                <div class="pairs-list">
                    ${Object.entries(stats.pairsStats)
                        .slice(0, 3)
                        .map(([pair, pairStats]) => `
                            <div class="pair-item">
                                <span>${pair}</span>
                                <span class="${pairStats.profit >= 0 ? 'text-success' : 'text-danger'}">
                                    ${formatCurrency(pairStats.profit)}
                                </span>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Load dan tampilkan recent trades
     */
    function loadRecentTrades() {
        const recentTrades = Storage.getAllTrades()
            .sort((a, b) => new Date(b.tradeDate) - new Date(a.tradeDate))
            .slice(0, 5);
        
        const tbody = document.getElementById('recentTradesBody');
        if (!tbody) return;
        
        if (recentTrades.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        Belum ada data trading. <a href="journal.html">Buat trade pertama!</a>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = recentTrades.map(trade => {
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
                <tr>
                    <td>${trade.tradeDate}</td>
                    <td><strong>${trade.symbol}</strong></td>
                    <td>
                        <span class="preview-direction ${trade.direction.toLowerCase()}">
                            ${trade.direction}
                        </span>
                    </td>
                    <td>${trade.lotSize}</td>
                    <td>${trade.entryPrice}</td>
                    <td>${trade.exitPrice || '-'}</td>
                    <td class="${plClass}">${plAmount}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                </tr>
            `;
        }).join('');
    }
    
    /**
     * Setup risk management calculator
     */
    function setupRiskCalculator() {
        const calculateBtn = document.getElementById('calculateRisk');
        const calcResults = document.getElementById('calcResults');
        
        if (!calculateBtn || !calcResults) return;
        
        calculateBtn.addEventListener('click', function() {
            try {
                // Ambil input values
                const balance = parseFloat(document.getElementById('balance').value);
                const riskPercent = parseFloat(document.getElementById('riskPercent').value);
                const stopLossPips = parseFloat(document.getElementById('stopLoss').value);
                const pair = document.getElementById('pairSelect').value;
                
                // Validasi input
                if (!balance || !riskPercent || !stopLossPips) {
                    throw new Error('Harap isi semua field kalkulator');
                }
                
                if (riskPercent > 10) {
                    throw new Error('Risk tidak boleh lebih dari 10% per trade');
                }
                
                // Hitung risk amount
                const riskAmount = balance * (riskPercent / 100);
                
                // Tentukan pip value berdasarkan pair
                let pipValue;
                let pipSize;
                
                if (pair.includes('XAU') || pair.includes('GOLD')) {
                    // Gold: 1 pip = $0.01 per ounce, 1 lot = 100 ounce
                    pipValue = 0.01;
                    pipSize = 0.01;
                } else if (pair.includes('BTC') || pair.includes('CRYPTO')) {
                    // Crypto: disederhanakan
                    pipValue = 1;
                    pipSize = 0.01;
                } else {
                    // Forex: 1 pip = $10 per lot standard
                    pipValue = 10;
                    pipSize = 0.0001;
                }
                
                // Hitung lot size
                // Formula: Lot Size = Risk Amount / (Stop Loss Pips * Pip Value)
                const lotSize = riskAmount / (stopLossPips * pipValue);
                
                // Hitung position size (dalam unit)
                let positionSize;
                if (pair.includes('XAU') || pair.includes('GOLD')) {
                    positionSize = lotSize * 100; // 1 lot = 100 ounce
                } else if (pair.includes('BTC') || pair.includes('CRYPTO')) {
                    positionSize = lotSize; // Crypto
                } else {
                    positionSize = lotSize * 100000; // 1 lot = 100,000 unit
                }
                
                // Tampilkan hasil
                calcResults.innerHTML = `
                    <div class="calc-result-item">
                        <span>Risk Amount (${riskPercent}%):</span>
                        <span class="text-warning">$${riskAmount.toFixed(2)}</span>
                    </div>
                    <div class="calc-result-item">
                        <span>Stop Loss Pips:</span>
                        <span>${stopLossPips} pips</span>
                    </div>
                    <div class="calc-result-item">
                        <span>Pip Value (per lot):</span>
                        <span>$${pipValue}</span>
                    </div>
                    <div class="calc-result-item">
                        <span>Recommended Lot Size:</span>
                        <span class="text-success"><strong>${lotSize.toFixed(2)} lots</strong></span>
                    </div>
                    <div class="calc-result-item">
                        <span>Position Size:</span>
                        <span>${positionSize.toLocaleString()} ${getPositionUnit(pair)}</span>
                    </div>
                    <div class="calc-result-item">
                        <span>Risk Per Pip:</span>
                        <span>$${(riskAmount / stopLossPips).toFixed(2)}</span>
                    </div>
                `;
                
            } catch (error) {
                calcResults.innerHTML = `
                    <div class="calc-result-item text-danger">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Error: ${error.message}</span>
                    </div>
                `;
            }
        });
    }
    
    /**
     * Helper function untuk mendapatkan unit position size
     */
    function getPositionUnit(pair) {
        if (pair.includes('XAU') || pair.includes('GOLD')) {
            return 'ounce';
        } else if (pair.includes('BTC')) {
            return 'BTC';
        } else if (pair.includes('ETH')) {
            return 'ETH';
        } else if (pair.includes('CRYPTO')) {
            return 'coins';
        } else {
            return 'units';
        }
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
    
    console.log('✅ Stats.js initialized successfully');
});