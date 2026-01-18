/**
 * CHART.JS
 * 
 * File ini menangali pembuatan chart menggunakan Chart.js library.
 * Semua grafik di dashboard dibuat di sini.
 */

// Inisialisasi chart saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('📈 Chart.js loaded');
    
    // Inisialisasi semua chart
    initializeCharts();
    
    // Tambahkan resize listener untuk responsive chart
    window.addEventListener('resize', function() {
        if (window.equityChart) {
            window.equityChart.resize();
        }
        if (window.pairChart) {
            window.pairChart.resize();
        }
    });
});

/**
 * Fungsi utama untuk menginisialisasi semua chart
 */
function initializeCharts() {
    try {
        // Inisialisasi equity chart
        initEquityChart();
        
        // Inisialisasi pair distribution chart
        initPairChart();
        
        console.log('✅ All charts initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing charts:', error);
    }
}

/**
 * Membuat equity curve chart
 */
function initEquityChart() {
    const ctx = document.getElementById('equityChart');
    if (!ctx) return;
    
    // Ambil data trading
    const allTrades = Storage.getAllTrades();
    const closedTrades = allTrades.filter(trade => trade.exitPrice);
    
    if (closedTrades.length === 0) {
        // Tampilkan placeholder jika tidak ada data
        ctx.parentElement.innerHTML += `
            <div class="no-data-placeholder">
                <i class="fas fa-chart-line"></i>
                <p>Belum ada data trading untuk ditampilkan</p>
                <small>Mulai catat trade Anda untuk melihat grafik equity</small>
            </div>
        `;
        return;
    }
    
    // Sort trades by date
    closedTrades.sort((a, b) => new Date(a.tradeDate) - new Date(b.tradeDate));
    
    // Buat equity curve
    let equity = 10000; // Starting equity
    const equityData = [equity];
    const labels = ['Start'];
    
    closedTrades.forEach((trade, index) => {
        equity += trade.profitLoss || 0;
        equityData.push(equity);
        labels.push(`Trade ${index + 1}`);
    });
    
    // Buat chart
    window.equityChart = new Chart(ctx, {
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
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            family: 'Inter',
                            size: 12
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
                            return `Equity: $${context.raw.toFixed(2)}`;
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
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animations: {
                tension: {
                    duration: 1000,
                    easing: 'linear'
                }
            }
        }
    });
}

/**
 * Membuat pair distribution chart
 */
function initPairChart() {
    const ctx = document.getElementById('pairChart');
    if (!ctx) return;
    
    // Ambil data trading
    const allTrades = Storage.getAllTrades();
    
    if (allTrades.length === 0) {
        // Tampilkan placeholder jika tidak ada data
        ctx.parentElement.innerHTML += `
            <div class="no-data-placeholder">
                <i class="fas fa-chart-pie"></i>
                <p>Belum ada data trading untuk ditampilkan</p>
            </div>
        `;
        return;
    }
    
    // Hitung distribusi pair
    const pairCounts = {};
    allTrades.forEach(trade => {
        pairCounts[trade.symbol] = (pairCounts[trade.symbol] || 0) + 1;
    });
    
    // Sort dan ambil top 5 pairs
    const sortedPairs = Object.entries(pairCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const labels = sortedPairs.map(pair => pair[0]);
    const data = sortedPairs.map(pair => pair[1]);
    
    // Warna untuk chart
    const backgroundColors = [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)'
    ];
    
    const borderColors = [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)',
        'rgb(139, 92, 246)'
    ];
    
    // Buat chart
    window.pairChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            family: 'Inter',
                            size: 12
                        },
                        padding: 20
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
                            const value = context.raw;
                            const total = data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${value} trades (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%',
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

/**
 * Fungsi untuk update chart dengan data baru
 */
function updateCharts() {
    if (window.equityChart) {
        window.equityChart.destroy();
    }
    if (window.pairChart) {
        window.pairChart.destroy();
    }
    
    initializeCharts();
}

/**
 * Fungsi untuk menghitung statistik trading
 */
function calculateTradeStats(trades) {
    const stats = {
        total: trades.length,
        wins: 0,
        losses: 0,
        totalProfit: 0,
        avgProfit: 0,
        maxWin: 0,
        maxLoss: 0,
        winRate: 0
    };
    
    if (trades.length === 0) {
        return stats;
    }
    
    let totalProfit = 0;
    
    trades.forEach(trade => {
        const profit = trade.profitLoss || 0;
        totalProfit += profit;
        
        if (profit > 0) {
            stats.wins++;
            stats.maxWin = Math.max(stats.maxWin, profit);
        } else if (profit < 0) {
            stats.losses++;
            stats.maxLoss = Math.min(stats.maxLoss, profit);
        }
    });
    
    stats.totalProfit = totalProfit;
    stats.avgProfit = totalProfit / trades.length;
    stats.winRate = (stats.wins / trades.length) * 100;
    
    return stats;
}

/**
 * Fungsi untuk membuat performance chart berdasarkan timeframe
 */
function createTimeframeChart(canvasId, timeframe) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    
    // Filter trades berdasarkan timeframe
    const allTrades = Storage.getAllTrades();
    const filteredTrades = allTrades.filter(trade => trade.timeframe === timeframe);
    
    if (filteredTrades.length === 0) {
        return null;
    }
    
    // Group trades by month
    const monthlyData = {};
    filteredTrades.forEach(trade => {
        const date = new Date(trade.tradeDate);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                profit: 0,
                trades: 0
            };
        }
        
        monthlyData[monthKey].profit += trade.profitLoss || 0;
        monthlyData[monthKey].trades++;
    });
    
    // Sort months
    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths;
    const profitData = sortedMonths.map(month => monthlyData[month].profit);
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Profit/Loss (${timeframe})`,
                data: profitData,
                backgroundColor: profitData.map(p => p >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
                borderColor: profitData.map(p => p >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

// Ekspor fungsi ke global scope
window.initializeCharts = initializeCharts;
window.updateCharts = updateCharts;

// Tambahkan style untuk placeholder
const chartStyle = document.createElement('style');
chartStyle.textContent = `
    .no-data-placeholder {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-muted);
    }
    
    .no-data-placeholder i {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
    
    .no-data-placeholder p {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
    }
    
    .no-data-placeholder small {
        font-size: 0.9rem;
    }
`;
document.head.appendChild(chartStyle);

console.log('✅ Chart.js module ready');