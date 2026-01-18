/**
 * STORAGE.JS
 * 
 * File ini menangani semua operasi penyimpanan data ke LocalStorage.
 * LocalStorage adalah database sederhana di browser Anda yang menyimpan data secara lokal.
 * 
 * Cara kerja LocalStorage:
 * 1. Data disimpan dalam bentuk key-value pairs (pasangan kunci-nilai)
 * 2. Data bertahan bahkan setelah browser ditutup
 * 3. Data hanya bisa menyimpan string
 * 4. Maksimal 5-10MB tergantung browser
 */

// Nama kunci untuk LocalStorage
const STORAGE_KEYS = {
    TRADES: 'trading_journal_trades',
    USER: 'trading_journal_user',
    SETTINGS: 'trading_journal_settings',
    TEMPLATES: 'trading_journal_templates'
};

/**
 * Helper function untuk menambahkan delay (simulasi loading)
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Menginisialisasi storage jika kosong
 */
function initStorage() {
    console.log('🔄 Menginisialisasi storage...');
    
    if (!localStorage.getItem(STORAGE_KEYS.TRADES)) {
        localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify([]));
        console.log('✅ Trades storage diinisialisasi');
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
            username: 'Trader',
            pin: '1234',
            createdAt: new Date().toISOString()
        }));
        console.log('✅ User storage diinisialisasi');
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
            currency: 'USD',
            defaultRisk: 2,
            theme: 'dark',
            notifications: true
        }));
        console.log('✅ Settings storage diinisialisasi');
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
        localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify([]));
        console.log('✅ Templates storage diinisialisasi');
    }
}

/**
 * Mendapatkan semua data trade dari storage
 * @returns {Array} Array dari semua trade
 */
function getAllTrades() {
    try {
        const trades = localStorage.getItem(STORAGE_KEYS.TRADES);
        return trades ? JSON.parse(trades) : [];
    } catch (error) {
        console.error('❌ Error mengambil trades:', error);
        return [];
    }
}

/**
 * Menyimpan trade baru ke storage
 * @param {Object} tradeData Data trade yang akan disimpan
 * @returns {Promise<Object>} Trade yang berhasil disimpan
 */
async function saveTrade(tradeData) {
    try {
        console.log('💾 Menyimpan trade baru...');
        
        // Simulasi loading
        await delay(500);
        
        // Validasi data
        if (!tradeData.id) {
            tradeData.id = Date.now().toString(); // ID unik berdasarkan timestamp
        }
        
        if (!tradeData.createdAt) {
            tradeData.createdAt = new Date().toISOString();
        }
        
        if (!tradeData.updatedAt) {
            tradeData.updatedAt = new Date().toISOString();
        }
        
        // Ambil semua trades yang ada
        const allTrades = getAllTrades();
        
        // Tambahkan trade baru
        allTrades.push(tradeData);
        
        // Simpan kembali ke storage
        localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(allTrades));
        
        console.log('✅ Trade berhasil disimpan dengan ID:', tradeData.id);
        return tradeData;
        
    } catch (error) {
        console.error('❌ Error menyimpan trade:', error);
        throw error;
    }
}

/**
 * Mengupdate trade yang sudah ada
 * @param {string} tradeId ID trade yang akan diupdate
 * @param {Object} updates Data yang akan diupdate
 * @returns {Promise<Object>} Trade yang sudah diupdate
 */
async function updateTrade(tradeId, updates) {
    try {
        console.log('🔄 Mengupdate trade dengan ID:', tradeId);
        
        await delay(300);
        
        const allTrades = getAllTrades();
        const tradeIndex = allTrades.findIndex(trade => trade.id === tradeId);
        
        if (tradeIndex === -1) {
            throw new Error('Trade tidak ditemukan');
        }
        
        // Update data
        allTrades[tradeIndex] = {
            ...allTrades[tradeIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        // Simpan kembali
        localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(allTrades));
        
        console.log('✅ Trade berhasil diupdate');
        return allTrades[tradeIndex];
        
    } catch (error) {
        console.error('❌ Error mengupdate trade:', error);
        throw error;
    }
}

/**
 * Menghapus trade dari storage
 * @param {string} tradeId ID trade yang akan dihapus
 * @returns {Promise<boolean>} true jika berhasil
 */
async function deleteTrade(tradeId) {
    try {
        console.log('🗑️ Menghapus trade dengan ID:', tradeId);
        
        await delay(300);
        
        const allTrades = getAllTrades();
        const filteredTrades = allTrades.filter(trade => trade.id !== tradeId);
        
        // Periksa apakah ada perubahan
        if (filteredTrades.length === allTrades.length) {
            throw new Error('Trade tidak ditemukan');
        }
        
        localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(filteredTrades));
        
        console.log('✅ Trade berhasil dihapus');
        return true;
        
    } catch (error) {
        console.error('❌ Error menghapus trade:', error);
        throw error;
    }
}

/**
 * Menghapus semua data trades
 * @returns {Promise<boolean>} true jika berhasil
 */
async function deleteAllTrades() {
    try {
        console.log('⚠️ Menghapus SEMUA data trades...');
        
        // Konfirmasi pengguna
        const confirmed = confirm('Yakin ingin menghapus SEMUA data trading? Tindakan ini tidak bisa dibatalkan!');
        
        if (!confirmed) {
            console.log('❌ Penghapusan dibatalkan oleh user');
            return false;
        }
        
        await delay(500);
        
        localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify([]));
        
        console.log('✅ Semua data trades berhasil dihapus');
        return true;
        
    } catch (error) {
        console.error('❌ Error menghapus semua trades:', error);
        throw error;
    }
}

/**
 * Mendapatkan trade berdasarkan ID
 * @param {string} tradeId ID trade yang dicari
 * @returns {Object|null} Data trade atau null jika tidak ditemukan
 */
function getTradeById(tradeId) {
    try {
        const allTrades = getAllTrades();
        return allTrades.find(trade => trade.id === tradeId) || null;
    } catch (error) {
        console.error('❌ Error mendapatkan trade:', error);
        return null;
    }
}

/**
 * Mendapatkan trades dengan filter tertentu
 * @param {Object} filters Objek filter
 * @returns {Array} Array trades yang sesuai filter
 */
function getFilteredTrades(filters = {}) {
    try {
        let allTrades = getAllTrades();
        
        // Terapkan filter jika ada
        if (filters.pair) {
            allTrades = allTrades.filter(trade => trade.symbol === filters.pair);
        }
        
        if (filters.direction) {
            allTrades = allTrades.filter(trade => trade.direction === filters.direction);
        }
        
        if (filters.result) {
            allTrades = allTrades.filter(trade => {
                if (filters.result === 'OPEN') return !trade.exitPrice;
                if (filters.result === 'WIN') return trade.profitLoss > 0;
                if (filters.result === 'LOSS') return trade.profitLoss < 0;
                return true;
            });
        }
        
        if (filters.date) {
            const now = new Date();
            const cutoff = new Date();
            
            switch (filters.date) {
                case 'week':
                    cutoff.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    cutoff.setMonth(now.getMonth() - 1);
                    break;
                case '3months':
                    cutoff.setMonth(now.getMonth() - 3);
                    break;
            }
            
            allTrades = allTrades.filter(trade => {
                const tradeDate = new Date(trade.tradeDate);
                return tradeDate >= cutoff;
            });
        }
        
        // Urutkan berdasarkan tanggal terbaru
        allTrades.sort((a, b) => new Date(b.tradeDate) - new Date(a.tradeDate));
        
        return allTrades;
        
    } catch (error) {
        console.error('❌ Error filter trades:', error);
        return [];
    }
}

/**
 * Mendapatkan statistik dari semua trades
 * @returns {Object} Objek statistik
 */
function getTradingStats() {
    try {
        const allTrades = getAllTrades();
        const closedTrades = allTrades.filter(trade => trade.exitPrice);
        
        // Inisialisasi statistik
        const stats = {
            totalTrades: allTrades.length,
            closedTrades: closedTrades.length,
            openTrades: allTrades.length - closedTrades.length,
            totalWins: 0,
            totalLosses: 0,
            totalProfit: 0,
            winRate: 0,
            avgRR: 0,
            bestTrade: 0,
            worstTrade: 0,
            consecutiveWins: 0,
            consecutiveLosses: 0,
            monthlyProfit: 0,
            pairsStats: {}
        };
        
        if (closedTrades.length === 0) {
            return stats;
        }
        
        // Hitung statistik dasar
        let totalRR = 0;
        let currentStreak = 0;
        let maxWins = 0;
        let maxLosses = 0;
        
        closedTrades.forEach(trade => {
            const profit = trade.profitLoss || 0;
            
            // Hitung win/loss
            if (profit > 0) {
                stats.totalWins++;
                currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
                maxWins = Math.max(maxWins, currentStreak);
                maxLosses = Math.max(maxLosses, Math.abs(currentStreak));
                currentStreak = currentStreak > 0 ? currentStreak : 0;
            } else if (profit < 0) {
                stats.totalLosses++;
                currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
                maxLosses = Math.max(maxLosses, Math.abs(currentStreak));
                maxWins = Math.max(maxWins, Math.abs(currentStreak));
                currentStreak = currentStreak < 0 ? currentStreak : 0;
            }
            
            // Total profit
            stats.totalProfit += profit;
            
            // Best/worst trade
            if (profit > stats.bestTrade) stats.bestTrade = profit;
            if (profit < stats.worstTrade) stats.worstTrade = profit;
            
            // RR Ratio
            if (trade.rrRatio) {
                totalRR += parseFloat(trade.rrRatio);
            }
            
            // Stats per pair
            if (!stats.pairsStats[trade.symbol]) {
                stats.pairsStats[trade.symbol] = {
                    trades: 0,
                    wins: 0,
                    losses: 0,
                    profit: 0
                };
            }
            
            stats.pairsStats[trade.symbol].trades++;
            stats.pairsStats[trade.symbol].profit += profit;
            
            if (profit > 0) {
                stats.pairsStats[trade.symbol].wins++;
            } else if (profit < 0) {
                stats.pairsStats[trade.symbol].losses++;
            }
        });
        
        // Hitung rates dan averages
        stats.winRate = closedTrades.length > 0 
            ? (stats.totalWins / closedTrades.length * 100).toFixed(1)
            : 0;
        
        stats.avgRR = closedTrades.length > 0 
            ? (totalRR / closedTrades.length).toFixed(2)
            : 0;
        
        stats.consecutiveWins = maxWins;
        stats.consecutiveLosses = maxLosses;
        
        // Hitung profit bulan ini
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        stats.monthlyProfit = closedTrades
            .filter(trade => {
                const tradeDate = new Date(trade.tradeDate);
                return tradeDate.getMonth() === thisMonth && 
                       tradeDate.getFullYear() === thisYear;
            })
            .reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
        
        return stats;
        
    } catch (error) {
        console.error('❌ Error menghitung statistik:', error);
        return {
            totalTrades: 0,
            closedTrades: 0,
            openTrades: 0,
            totalWins: 0,
            totalLosses: 0,
            totalProfit: 0,
            winRate: 0,
            avgRR: 0,
            bestTrade: 0,
            worstTrade: 0,
            consecutiveWins: 0,
            consecutiveLosses: 0,
            monthlyProfit: 0,
            pairsStats: {}
        };
    }
}

/**
 * Mengekspor semua data ke format CSV
 * @returns {string} String CSV
 */
function exportToCSV() {
    try {
        const allTrades = getAllTrades();
        
        if (allTrades.length === 0) {
            throw new Error('Tidak ada data untuk diekspor');
        }
        
        // Buat header CSV
        const headers = [
            'ID', 'Tanggal', 'Pair', 'Direction', 'Timeframe', 'Lot Size',
            'Entry Price', 'Stop Loss', 'Take Profit', 'Exit Price',
            'Profit/Loss', 'RR Ratio', 'Emosi', 'Catatan', 'Status'
        ];
        
        // Buat baris data
        const rows = allTrades.map(trade => {
            const status = trade.exitPrice 
                ? (trade.profitLoss > 0 ? 'WIN' : 'LOSS')
                : 'OPEN';
            
            return [
                trade.id,
                trade.tradeDate,
                trade.symbol,
                trade.direction,
                trade.timeframe,
                trade.lotSize,
                trade.entryPrice,
                trade.stopLoss,
                trade.takeProfit,
                trade.exitPrice || '-',
                trade.profitLoss || '0',
                trade.rrRatio || '0',
                trade.emotions ? trade.emotions.join(', ') : '',
                trade.notes ? `"${trade.notes.replace(/"/g, '""')}"` : '',
                status
            ].join(',');
        });
        
        // Gabungkan header dan data
        const csvContent = [headers.join(','), ...rows].join('\n');
        
        console.log('📊 Data berhasil diekspor ke CSV');
        return csvContent;
        
    } catch (error) {
        console.error('❌ Error mengekspor CSV:', error);
        throw error;
    }
}

/**
 * Mendapatkan data user
 * @returns {Object} Data user
 */
function getUserData() {
    try {
        const userData = localStorage.getItem(STORAGE_KEYS.USER);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('❌ Error mengambil user data:', error);
        return null;
    }
}

/**
 * Menyimpan data user
 * @param {Object} userData Data user
 */
function saveUserData(userData) {
    try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        console.log('✅ User data berhasil disimpan');
    } catch (error) {
        console.error('❌ Error menyimpan user data:', error);
    }
}

// Inisialisasi storage saat file di-load
initStorage();

// Ekspor fungsi ke global scope
window.Storage = {
    getAllTrades,
    saveTrade,
    updateTrade,
    deleteTrade,
    deleteAllTrades,
    getTradeById,
    getFilteredTrades,
    getTradingStats,
    exportToCSV,
    getUserData,
    saveUserData,
    STORAGE_KEYS
};