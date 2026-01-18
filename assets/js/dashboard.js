/**
 * DASHBOARD.JS - Dashboard Page Logic
 * 
 * File ini menangani semua logika di halaman dashboard.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Dashboard initialized');
    
    // Initialize components
    initDashboard();
    setupEventListeners();
});

function initDashboard() {
    // Update stats
    updateStats();
    
    // Load recent trades
    loadRecentTrades();
    
    // Initialize charts
    initCharts();
    
    // Setup risk calculator
    setupRiskCalculator();
}

function updateStats() {
    const stats = Storage.calculateStats();
    
    // Update stat cards
    document.getElementById('totalTrades').textContent = stats.total;
    document.getElementById('winRate').textContent = `${stats.winRate}%`;
    document.getElementById('totalProfit').textContent = App.formatCurrency(stats.totalProfit);
    document.getElementById('avgRR').textContent = `${stats.avgRR}:1`;
    
    // Update user stats in sidebar
    const userStatsElements = document.querySelectorAll('#userStats');
    userStatsElements.forEach(el => {
        el.textContent = `${stats.total} Trade${stats.total !== 1 ? 's' : ''}`;
    });
}

function loadRecentTrades() {
    const trades = Storage.getFilteredTrades({ sortBy: 'date-desc' });
    const recentTrades = trades.slice(0, 5);
    const container = document.getElementById('recentTrades');
    
    if (!container) return;
    
    if (recentTrades.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <p>Belum ada data trading</p>
                <button class="btn-secondary" onclick="window.location.href='journal.html'">
                    <i class="fas fa-plus"></i> Buat Trade Pertama
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentTrades.map(trade => `
        <div class="trade-item" data-id="${trade.id}" onclick="viewTradeDetail('${trade.id}')">
            <div class="trade-info">
                <div class="trade-symbol">${trade.symbol}</div>
                <div class="trade-direction ${trade.direction.toLowerCase()}">
                    ${trade.direction}
                </div>
            </div>
            
            <div class="trade-details">
                <span>${trade.timeframe}</span>
                <span>${trade.lotSize} lot</span>
                <span>${trade.exitPrice ? App.formatCurrency(trade.profitLoss) : 'OPEN'}</span>
            </div>
            
            <div class="trade-result ${trade.profitLoss > 0 ? 'profit' : trade.profitLoss < 0 ? 'loss' : ''}">
                ${trade.exitPrice ? 
                    (trade.profitLoss > 0 ? 
                        `<i class="fas fa-arrow-up"></i> ${App.formatCurrency(trade.profitLoss)}` :
                        `<i class="fas fa-arrow-down"></i> ${App.formatCurrency(Math.abs(trade.profitLoss))}`) :
                    '<i class="fas fa-clock"></i> OPEN'}
            </div>
        </div>
    `).join('');
}

function initCharts() {
    // Equity Chart
    initEquityChart();
    
    // Pair Distribution Chart
    initPairChart();
}

function initEquityChart() {
    const ctx = document.getElementById('equityChart');
    if (!ctx) return;
    
    const trades = Storage.getTrades()
        .filter(t => t.exitPrice)
        .sort((a, b) => new Date(a.tradeDate) - new Date(b.tradeDate));
    
    if (trades.length === 0) {
        ctx.parentElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <p>Belum ada data untuk chart</p>
            </div>
        `;
        return;
    }
    
    // Calculate equity curve
    let equity = 10000;
    const equityData = [equity];
    const labels = ['Start'];
    
    trades.forEach((trade, index) => {
        equity += trade.profitLoss || 0;
        equityData.push(equity);
        labels.push(`Trade ${index + 1}`);
    });
    
    // Create chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Equity Curve',
                data: equityData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: '#475569',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `Equity: ${App.formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(71, 85, 105, 0.3)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        maxTicksLimit: 10
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(71, 85, 105, 0.3)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return App.formatCurrency(value);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function initPairChart() {
    const ctx = document.getElementById('pairChart');
    if (!ctx) return;
    
    const trades = Storage.getTrades();
    const pairCounts = {};
    
    trades.forEach(trade => {
        pairCounts[trade.symbol] = (pairCounts[trade.symbol] || 0) + 1;
    });
    
    const sortedPairs = Object.entries(pairCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (sortedPairs.length === 0) {
        ctx.parentElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-pie"></i>
                <p>Belum ada data untuk chart</p>
            </div>
        `;
        return;
    }
    
    const labels = sortedPairs.map(pair => pair[0]);
    const data = sortedPairs.map(pair => pair[1]);
    
    const backgroundColors = [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)'
    ];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
                borderWidth: 2,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: '#475569',
                    borderWidth: 1
                }
            },
            cutout: '60%'
        }
    });
}

function setupRiskCalculator() {
    const calculateBtn = document.getElementById('calculateRiskBtn');
    const riskSlider = document.getElementById('calcRisk');
    const riskValue = document.getElementById('riskValue');
    const resultsDiv = document.getElementById('calculatorResults');
    
    if (!calculateBtn) return;
    
    // Update risk value display
    riskSlider.addEventListener('input', function() {
        riskValue.textContent = this.value + '%';
    });
    
    // Calculate button click
    calculateBtn.addEventListener('click', function() {
        calculateRisk();
    });
    
    // Enter key support
    document.querySelectorAll('.calculator-inputs input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateRisk();
            }
        });
    });
}

function calculateRisk() {
    try {
        const balance = parseFloat(document.getElementById('calcBalance').value);
        const riskPercent = parseFloat(document.getElementById('calcRisk').value);
        const stopLossPips = parseFloat(document.getElementById('calcStopLoss').value);
        const pair = document.getElementById('calcPair').value;
        
        // Validation
        if (!balance || balance <= 0) {
            throw new Error('Balance harus lebih dari 0');
        }
        
        if (!riskPercent || riskPercent <= 0 || riskPercent > 10) {
            throw new Error('Risk harus antara 0.1% - 10%');
        }
        
        if (!stopLossPips || stopLossPips <= 0) {
            throw new Error('Stop Loss harus lebih dari 0 pips');
        }
        
        // Calculate risk amount
        const riskAmount = balance * (riskPercent / 100);
        
        // Determine pip value based on pair
        let pipValue;
        let pipSize;
        let positionUnit;
        
        if (pair.includes('XAU') || pair.includes('GOLD')) {
            // Gold: 1 lot = 100 ounce, 1 pip = $0.01
            pipValue = 0.01;
            pipSize = 0.01;
            positionUnit = 'ounce';
        } else if (pair.includes('BTC') || pair.includes('CRYPTO')) {
            // Crypto: simplified
            pipValue = 1;
            pipSize = 0.01;
            positionUnit = 'units';
        } else {
            // Forex: 1 lot = 100,000 unit, 1 pip = $10
            pipValue = 10;
            pipSize = 0.0001;
            positionUnit = 'units';
        }
        
        // Calculate lot size
        const lotSize = riskAmount / (stopLossPips * pipValue);
        
        // Calculate position size
        let positionSize;
        if (pair.includes('XAU') || pair.includes('GOLD')) {
            positionSize = lotSize * 100; // 1 lot = 100 ounce
        } else if (pair.includes('BTC') || pair.includes('CRYPTO')) {
            positionSize = lotSize;
        } else {
            positionSize = lotSize * 100000; // 1 lot = 100,000 unit
        }
        
        // Update results
        const resultsDiv = document.getElementById('calculatorResults');
        resultsDiv.innerHTML = `
            <div class="calc-result">
                <span>Risk Amount (${riskPercent}%):</span>
                <strong class="text-warning">${App.formatCurrency(riskAmount)}</strong>
            </div>
            <div class="calc-result">
                <span>Stop Loss Pips:</span>
                <span>${stopLossPips} pips</span>
            </div>
            <div class="calc-result">
                <span>Pip Value (per lot):</span>
                <span>${App.formatCurrency(pipValue)}</span>
            </div>
            <div class="calc-result">
                <span>Recommended Lot Size:</span>
                <strong class="text-success">${lotSize.toFixed(2)} lots</strong>
            </div>
            <div class="calc-result">
                <span>Position Size:</span>
                <span>${positionSize.toLocaleString()} ${positionUnit}</span>
            </div>
            <div class="calc-result total">
                <span>Risk Per Pip:</span>
                <strong>${App.formatCurrency(riskAmount / stopLossPips)}</strong>
            </div>
        `;
        
        resultsDiv.classList.add('show');
        
        // Scroll to results
        setTimeout(() => {
            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
        
    } catch (error) {
        App.showNotification(error.message, 'error');
    }
}

function viewTradeDetail(tradeId) {
    const trade = Storage.getTradeById(tradeId);
    if (!trade) return;
    
    // Redirect to history page with trade ID in URL
    window.location.href = `history.html?trade=${tradeId}`;
}

function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            this.classList.add('fa-spin');
            updateStats();
            loadRecentTrades();
            
            setTimeout(() => {
                this.classList.remove('fa-spin');
                App.showNotification('Dashboard diperbarui', 'success');
            }, 1000);
        });
    }
    
    // Add trade button
    const addTradeBtn = document.getElementById('addTradeBtn');
    if (addTradeBtn) {
        addTradeBtn.addEventListener('click', function() {
            window.location.href = 'journal.html';
        });
    }
    
    // View all trades button
    const viewAllTradesBtn = document.getElementById('viewAllTrades');
    if (viewAllTradesBtn) {
        viewAllTradesBtn.addEventListener('click', function() {
            window.location.href = 'history.html';
        });
    }
    
    // Export data button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportData();
        });
    }
    
    // Chart period buttons
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.chart-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Here you would typically reload chart data based on period
            App.showNotification(`Chart diperbarui: ${this.textContent}`, 'info');
        });
    });
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

// Export functions
window.viewTradeDetail = viewTradeDetail;
window.calculateRisk = calculateRisk;
