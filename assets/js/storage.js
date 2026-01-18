/**
 * STORAGE.JS - LocalStorage Management
 * 
 * File ini menangani semua operasi penyimpanan data ke LocalStorage.
 */

const Storage = {
    // Storage keys
    KEYS: {
        TRADES: 'trading_journal_trades',
        USER: 'trading_journal_user',
        SETTINGS: 'trading_journal_settings',
        DRAFTS: 'trading_journal_drafts',
        TEMPLATES: 'trading_journal_templates'
    },
    
    // Initialize storage
    init: function() {
        console.log('💾 Initializing storage...');
        
        // Initialize trades if empty
        if (!this.getTrades().length) {
            // Add sample data for demo
            this.addSampleData();
        }
        
        // Initialize user if empty
        if (!this.getUser()) {
            this.setUser({
                username: 'Trader',
                pin: '1234',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            });
        }
        
        // Initialize settings if empty
        if (!this.getSettings()) {
            this.setSettings({
                currency: 'USD',
                defaultRisk: 2,
                theme: 'dark',
                notifications: true,
                autoCalculate: true,
                vibration: true
            });
        }
        
        console.log('✅ Storage initialized');
    },
    
    // Trade operations
    getTrades: function() {
        try {
            const trades = localStorage.getItem(this.KEYS.TRADES);
            return trades ? JSON.parse(trades) : [];
        } catch (error) {
            console.error('❌ Error getting trades:', error);
            return [];
        }
    },
    
    saveTrade: function(tradeData) {
        try {
            // Generate ID jika belum ada
            if (!tradeData.id) {
                tradeData.id = 'trade_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            
            // Set timestamps
            if (!tradeData.createdAt) {
                tradeData.createdAt = new Date().toISOString();
            }
            tradeData.updatedAt = new Date().toISOString();
            
            // Validate required fields
            const required = ['tradeDate', 'symbol', 'direction', 'entryPrice', 'stopLoss', 'takeProfit', 'lotSize'];
            for (const field of required) {
                if (!tradeData[field]) {
                    throw new Error(`Field ${field} is required`);
                }
            }
            
            // Get existing trades
            const trades = this.getTrades();
            
            // Check if updating existing trade
            const existingIndex = trades.findIndex(t => t.id === tradeData.id);
            if (existingIndex !== -1) {
                trades[existingIndex] = tradeData;
            } else {
                trades.unshift(tradeData); // Add to beginning
            }
            
            // Save back to storage
            localStorage.setItem(this.KEYS.TRADES, JSON.stringify(trades));
            
            // Update user stats
            this.updateUserStats();
            
            console.log('✅ Trade saved:', tradeData.id);
            return tradeData;
            
        } catch (error) {
            console.error('❌ Error saving trade:', error);
            throw error;
        }
    },
    
    deleteTrade: function(tradeId) {
        try {
            const trades = this.getTrades();
            const filteredTrades = trades.filter(trade => trade.id !== tradeId);
            
            if (filteredTrades.length === trades.length) {
                throw new Error('Trade not found');
            }
            
            localStorage.setItem(this.KEYS.TRADES, JSON.stringify(filteredTrades));
            
            // Update user stats
            this.updateUserStats();
            
            console.log('✅ Trade deleted:', tradeId);
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting trade:', error);
            throw error;
        }
    },
    
    updateTrade: function(tradeId, updates) {
        try {
            const trades = this.getTrades();
            const index = trades.findIndex(t => t.id === tradeId);
            
            if (index === -1) {
                throw new Error('Trade not found');
            }
            
            trades[index] = {
                ...trades[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem(this.KEYS.TRADES, JSON.stringify(trades));
            
            console.log('✅ Trade updated:', tradeId);
            return trades[index];
            
        } catch (error) {
            console.error('❌ Error updating trade:', error);
            throw error;
        }
    },
    
    getTradeById: function(tradeId) {
        try {
            const trades = this.getTrades();
            return trades.find(trade => trade.id === tradeId) || null;
        } catch (error) {
            console.error('❌ Error getting trade:', error);
            return null;
        }
    },
    
    getFilteredTrades: function(filters = {}) {
        try {
            let trades = this.getTrades();
            
            // Apply filters
            if (filters.symbol) {
                trades = trades.filter(t => t.symbol === filters.symbol);
            }
            
            if (filters.direction) {
                trades = trades.filter(t => t.direction === filters.direction);
            }
            
            if (filters.timeframe) {
                trades = trades.filter(t => t.timeframe === filters.timeframe);
            }
            
            if (filters.result) {
                trades = trades.filter(t => {
                    if (filters.result === 'WIN') return t.profitLoss > 0;
                    if (filters.result === 'LOSS') return t.profitLoss < 0;
                    if (filters.result === 'OPEN') return !t.exitPrice;
                    return true;
                });
            }
            
            if (filters.date) {
                const now = new Date();
                const cutoff = new Date();
                
                switch (filters.date) {
                    case 'today':
                        cutoff.setHours(0, 0, 0, 0);
                        break;
                    case 'week':
                        cutoff.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        cutoff.setMonth(now.getMonth() - 1);
                        break;
                    case 'last3':
                        cutoff.setMonth(now.getMonth() - 3);
                        break;
                }
                
                trades = trades.filter(t => {
                    const tradeDate = new Date(t.tradeDate);
                    return tradeDate >= cutoff;
                });
            }
            
            // Apply sorting
            if (filters.sortBy) {
                trades.sort((a, b) => {
                    const [field, order] = filters.sortBy.split('-');
                    const aValue = a[field];
                    const bValue = b[field];
                    
                    if (order === 'desc') {
                        return bValue - aValue;
                    } else {
                        return aValue - bValue;
                    }
                });
            } else {
                // Default sort by date descending
                trades.sort((a, b) => new Date(b.tradeDate) - new Date(a.tradeDate));
            }
            
            return trades;
            
        } catch (error) {
            console.error('❌ Error filtering trades:', error);
            return [];
        }
    },
    
    deleteAllTrades: function() {
        try {
            localStorage.setItem(this.KEYS.TRADES, JSON.stringify([]));
            this.updateUserStats();
            console.log('✅ All trades deleted');
            return true;
        } catch (error) {
            console.error('❌ Error deleting all trades:', error);
            throw error;
        }
    },
    
    // User operations
    getUser: function() {
        try {
            const user = localStorage.getItem(this.KEYS.USER);
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('❌ Error getting user:', error);
            return null;
        }
    },
    
    setUser: function(userData) {
        try {
            localStorage.setItem(this.KEYS.USER, JSON.stringify(userData));
            console.log('✅ User saved');
            return userData;
        } catch (error) {
            console.error('❌ Error saving user:', error);
            throw error;
        }
    },
    
    updateUserStats: function() {
        try {
            const user = this.getUser();
            if (!user) return;
            
            const trades = this.getTrades();
            const stats = this.calculateStats(trades);
            
            user.stats = stats;
            user.updatedAt = new Date().toISOString();
            
            this.setUser(user);
            
        } catch (error) {
            console.error('❌ Error updating user stats:', error);
        }
    },
    
    // Settings operations
    getSettings: function() {
        try {
            const settings = localStorage.getItem(this.KEYS.SETTINGS);
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('❌ Error getting settings:', error);
            return null;
        }
    },
    
    setSettings: function(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            console.log('✅ Settings saved');
            return settings;
        } catch (error) {
            console.error('❌ Error saving settings:', error);
            throw error;
        }
    },
    
    // Draft operations
    saveDraft: function(draftData) {
        try {
            const drafts = this.getDrafts();
            draftData.id = 'draft_' + Date.now();
            draftData.savedAt = new Date().toISOString();
            drafts.unshift(draftData);
            
            // Keep only last 10 drafts
            if (drafts.length > 10) {
                drafts.splice(10);
            }
            
            localStorage.setItem(this.KEYS.DRAFTS, JSON.stringify(drafts));
            console.log('✅ Draft saved');
            return draftData;
            
        } catch (error) {
            console.error('❌ Error saving draft:', error);
            throw error;
        }
    },
    
    getDrafts: function() {
        try {
            const drafts = localStorage.getItem(this.KEYS.DRAFTS);
            return drafts ? JSON.parse(drafts) : [];
        } catch (error) {
            console.error('❌ Error getting drafts:', error);
            return [];
        }
    },
    
    deleteDraft: function(draftId) {
        try {
            const drafts = this.getDrafts();
            const filtered = drafts.filter(d => d.id !== draftId);
            localStorage.setItem(this.KEYS.DRAFTS, JSON.stringify(filtered));
            console.log('✅ Draft deleted');
            return true;
        } catch (error) {
            console.error('❌ Error deleting draft:', error);
            throw error;
        }
    },
    
    // Template operations
    saveTemplate: function(templateData) {
        try {
            const templates = this.getTemplates();
            templateData.id = 'template_' + Date.now();
            templateData.createdAt = new Date().toISOString();
            templates.push(templateData);
            
            localStorage.setItem(this.KEYS.TEMPLATES, JSON.stringify(templates));
            console.log('✅ Template saved');
            return templateData;
            
        } catch (error) {
            console.error('❌ Error saving template:', error);
            throw error;
        }
    },
    
    getTemplates: function() {
        try {
            const templates = localStorage.getItem(this.KEYS.TEMPLATES);
            return templates ? JSON.parse(templates) : [];
        } catch (error) {
            console.error('❌ Error getting templates:', error);
            return [];
        }
    },
    
    // Stats calculation
    calculateStats: function(trades = null) {
        try {
            if (!trades) trades = this.getTrades();
            
            const closedTrades = trades.filter(t => t.exitPrice);
            const openTrades = trades.filter(t => !t.exitPrice);
            
            const stats = {
                total: trades.length,
                closed: closedTrades.length,
                open: openTrades.length,
                wins: 0,
                losses: 0,
                totalProfit: 0,
                bestTrade: 0,
                worstTrade: 0,
                winRate: 0,
                avgRR: 0,
                avgTrade: 0,
                monthlyProfit: this.calculateMonthlyProfit(trades),
                pairs: this.calculatePairStats(trades),
                byTimeframe: this.calculateTimeframeStats(trades)
            };
            
            if (closedTrades.length === 0) {
                return stats;
            }
            
            let totalRR = 0;
            
            closedTrades.forEach(trade => {
                const profit = trade.profitLoss || 0;
                stats.totalProfit += profit;
                
                if (profit > 0) {
                    stats.wins++;
                    if (profit > stats.bestTrade) stats.bestTrade = profit;
                } else if (profit < 0) {
                    stats.losses++;
                    if (profit < stats.worstTrade) stats.worstTrade = profit;
                }
                
                if (trade.rrRatio) {
                    totalRR += parseFloat(trade.rrRatio);
                }
            });
            
            stats.winRate = closedTrades.length > 0 ? 
                (stats.wins / closedTrades.length * 100).toFixed(1) : 0;
            stats.avgRR = closedTrades.length > 0 ? 
                (totalRR / closedTrades.length).toFixed(2) : 0;
            stats.avgTrade = closedTrades.length > 0 ? 
                (stats.totalProfit / closedTrades.length).toFixed(2) : 0;
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error calculating stats:', error);
            return {
                total: 0,
                closed: 0,
                open: 0,
                wins: 0,
                losses: 0,
                totalProfit: 0,
                bestTrade: 0,
                worstTrade: 0,
                winRate: 0,
                avgRR: 0,
                avgTrade: 0,
                monthlyProfit: 0,
                pairs: {},
                byTimeframe: {}
            };
        }
    },
    
    calculateMonthlyProfit: function(trades) {
        const monthly = {};
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        trades.forEach(trade => {
            if (!trade.exitPrice || !trade.profitLoss) return;
            
            const tradeDate = new Date(trade.tradeDate);
            const monthYear = `${tradeDate.getFullYear()}-${(tradeDate.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (!monthly[monthYear]) {
                monthly[monthYear] = 0;
            }
            
            monthly[monthYear] += trade.profitLoss;
        });
        
        // Get current month profit
        const currentMonthKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
        return monthly[currentMonthKey] || 0;
    },
    
    calculatePairStats: function(trades) {
        const pairs = {};
        
        trades.forEach(trade => {
            if (!pairs[trade.symbol]) {
                pairs[trade.symbol] = {
                    trades: 0,
                    wins: 0,
                    losses: 0,
                    profit: 0,
                    open: 0
                };
            }
            
            pairs[trade.symbol].trades++;
            
            if (trade.exitPrice) {
                if (trade.profitLoss > 0) {
                    pairs[trade.symbol].wins++;
                } else if (trade.profitLoss < 0) {
                    pairs[trade.symbol].losses++;
                }
                pairs[trade.symbol].profit += trade.profitLoss || 0;
            } else {
                pairs[trade.symbol].open++;
            }
        });
        
        return pairs;
    },
    
    calculateTimeframeStats: function(trades) {
        const timeframes = {};
        
        trades.forEach(trade => {
            if (!timeframes[trade.timeframe]) {
                timeframes[trade.timeframe] = {
                    trades: 0,
                    profit: 0,
                    winRate: 0
                };
            }
            
            timeframes[trade.timeframe].trades++;
            
            if (trade.exitPrice) {
                timeframes[trade.timeframe].profit += trade.profitLoss || 0;
            }
        });
        
        // Calculate win rates
        Object.keys(timeframes).forEach(tf => {
            const tfTrades = trades.filter(t => t.timeframe === tf && t.exitPrice);
            const wins = tfTrades.filter(t => t.profitLoss > 0).length;
            timeframes[tf].winRate = tfTrades.length > 0 ? 
                (wins / tfTrades.length * 100).toFixed(1) : 0;
        });
        
        return timeframes;
    },
    
    // Export/Import
    exportToCSV: function() {
        try {
            const trades = this.getTrades();
            
            if (trades.length === 0) {
                throw new Error('No trades to export');
            }
            
            // Define CSV headers
            const headers = [
                'ID', 'Date', 'Symbol', 'Timeframe', 'Direction', 'Lot Size',
                'Entry Price', 'Stop Loss', 'Take Profit', 'Exit Price',
                'Profit/Loss', 'RR Ratio', 'Pips SL', 'Pips TP',
                'Emotions', 'Notes', 'Screenshot', 'Status'
            ];
            
            // Create CSV rows
            const rows = trades.map(trade => {
                const status = trade.exitPrice ? 
                    (trade.profitLoss > 0 ? 'WIN' : 'LOSS') : 'OPEN';
                
                return [
                    trade.id,
                    trade.tradeDate,
                    trade.symbol,
                    trade.timeframe,
                    trade.direction,
                    trade.lotSize,
                    trade.entryPrice,
                    trade.stopLoss,
                    trade.takeProfit,
                    trade.exitPrice || '',
                    trade.profitLoss || '',
                    trade.rrRatio || '',
                    trade.slPips || '',
                    trade.tpPips || '',
                    trade.emotions ? trade.emotions.join(';') : '',
                    trade.notes ? `"${trade.notes.replace(/"/g, '""')}"` : '',
                    trade.screenshot || '',
                    status
                ].join(',');
            });
            
            // Combine headers and rows
            const csvContent = [headers.join(','), ...rows].join('\n');
            
            console.log('✅ CSV export created');
            return csvContent;
            
        } catch (error) {
            console.error('❌ Error exporting to CSV:', error);
            throw error;
        }
    },
    
    exportToJSON: function() {
        try {
            const data = {
                trades: this.getTrades(),
                user: this.getUser(),
                settings: this.getSettings(),
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            return JSON.stringify(data, null, 2);
            
        } catch (error) {
            console.error('❌ Error exporting to JSON:', error);
            throw error;
        }
    },
    
    importFromJSON: function(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (!data.trades || !Array.isArray(data.trades)) {
                throw new Error('Invalid data format');
            }
            
            // Backup current data
            const backup = {
                trades: this.getTrades(),
                user: this.getUser(),
                settings: this.getSettings()
            };
            
            // Try to import
            localStorage.setItem(this.KEYS.TRADES, JSON.stringify(data.trades));
            
            if (data.user) {
                localStorage.setItem(this.KEYS.USER, JSON.stringify(data.user));
            }
            
            if (data.settings) {
                localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(data.settings));
            }
            
            console.log('✅ Data imported successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error importing data:', error);
            throw error;
        }
    },
    
    // Sample data for demo
    addSampleData: function() {
        const sampleTrades = [
            {
                id: 'sample_1',
                tradeDate: new Date(Date.now() - 86400000 * 2).toISOString(),
                symbol: 'EURUSD',
                timeframe: 'H1',
                direction: 'BUY',
                lotSize: 0.1,
                entryPrice: 1.08500,
                stopLoss: 1.08300,
                takeProfit: 1.08800,
                exitPrice: 1.08750,
                profitLoss: 25.00,
                rrRatio: '1.67',
                slPips: 20,
                tpPips: 35,
                emotions: ['CONFIDENT', 'CALM'],
                notes: 'Good trend following trade',
                createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
                id: 'sample_2',
                tradeDate: new Date(Date.now() - 86400000).toISOString(),
                symbol: 'XAUUSD',
                timeframe: 'H4',
                direction: 'SELL',
                lotSize: 0.05,
                entryPrice: 2025.50,
                stopLoss: 2030.00,
                takeProfit: 2015.00,
                exitPrice: 2018.00,
                profitLoss: 37.50,
                rrRatio: '2.00',
                slPips: 45,
                tpPips: 105,
                emotions: ['HESITANT'],
                notes: 'Gold pullback trade',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];
        
        localStorage.setItem(this.KEYS.TRADES, JSON.stringify(sampleTrades));
        console.log('✅ Sample data added');
    }
};

// Inisialisasi storage
Storage.init();

// Export ke global scope
window.Storage = Storage;
