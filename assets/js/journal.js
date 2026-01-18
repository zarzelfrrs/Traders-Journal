/**
 * JOURNAL.JS - Journal Input Page Logic
 * 
 * File ini menangani form input jurnal trading.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Journal page initialized');
    
    // Initialize form
    initJournalForm();
    
    // Load recent trades preview
    loadRecentTrades();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check for draft to load
    checkForDraft();
});

function initJournalForm() {
    // Set default date and time
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const dateInput = document.getElementById('tradeDate');
    if (dateInput) {
        dateInput.value = localDateTime;
    }
    
    // Setup symbol selector
    const symbolSelect = document.getElementById('symbol');
    const customSymbolInput = document.getElementById('customSymbol');
    
    if (symbolSelect && customSymbolInput) {
        symbolSelect.addEventListener('change', function() {
            if (this.value === 'OTHER') {
                customSymbolInput.classList.remove('hidden');
                customSymbolInput.required = true;
                customSymbolInput.focus();
            } else {
                customSymbolInput.classList.add('hidden');
                customSymbolInput.required = false;
                customSymbolInput.value = '';
            }
        });
    }
    
    // Setup direction selector
    const directionInput = document.getElementById('direction');
    const directionButtons = document.querySelectorAll('.dir-btn');
    
    directionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            directionButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update hidden input
            const direction = this.dataset.direction;
            directionInput.value = direction;
            
            // Recalculate P/L if needed
            calculatePL();
        });
    });
    
    // Setup lot size presets
    const lotSizeInput = document.getElementById('lotSize');
    const lotPresets = document.querySelectorAll('.lot-presets button');
    
    lotPresets.forEach(btn => {
        btn.addEventListener('click', function() {
            const lotSize = this.dataset.lot;
            lotSizeInput.value = lotSize;
            
            // Recalculate P/L
            calculatePL();
        });
    });
    
    // Setup form steps
    setupFormSteps();
    
    // Setup auto calculation
    setupAutoCalculation();
}

function setupFormSteps() {
    const steps = document.querySelectorAll('.form-step');
    const stepButtons = document.querySelectorAll('[data-next], [data-prev]');
    
    stepButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetStep = this.dataset.next || this.dataset.prev;
            if (!targetStep) return;
            
            // Validate current step before moving
            if (this.dataset.next && !validateStep(getCurrentStep())) {
                return;
            }
            
            // Switch step
            switchStep(targetStep);
            
            // Update progress indicator
            updateProgressIndicator(targetStep);
        });
    });
}

function getCurrentStep() {
    const activeStep = document.querySelector('.form-step.active');
    return activeStep ? parseInt(activeStep.dataset.step) : 1;
}

function validateStep(stepNumber) {
    const step = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    const requiredInputs = step.querySelectorAll('[required]');
    
    let isValid = true;
    let firstInvalidInput = null;
    
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
            
            if (!firstInvalidInput) {
                firstInvalidInput = input;
            }
        } else {
            input.classList.remove('error');
        }
    });
    
    if (!isValid && firstInvalidInput) {
        App.showNotification('Harap isi semua field yang diperlukan', 'error');
        firstInvalidInput.focus();
        App.vibrate();
    }
    
    return isValid;
}

function switchStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show target step
    const targetStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (targetStep) {
        targetStep.classList.add('active');
        
        // Scroll to top of form
        targetStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateProgressIndicator(stepNumber) {
    // Remove active class from all steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Add active class to current and previous steps
    for (let i = 1; i <= stepNumber; i++) {
        const step = document.querySelector(`.step[data-step="${i}"]`);
        if (step) {
            step.classList.add('active');
        }
    }
}

function setupAutoCalculation() {
    // Fields that trigger P/L calculation
    const calculationFields = [
        'entryPrice', 'stopLoss', 'takeProfit', 'exitPrice', 'lotSize'
    ];
    
    calculationFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', App.debounce(calculatePL, 500));
        }
    });
    
    // Also recalculate when symbol or direction changes
    const symbolSelect = document.getElementById('symbol');
    if (symbolSelect) {
        symbolSelect.addEventListener('change', calculatePL);
    }
    
    const directionInput = document.getElementById('direction');
    if (directionInput) {
        directionInput.addEventListener('change', calculatePL);
    }
}

function calculatePL() {
    try {
        // Get form values
        const symbolSelect = document.getElementById('symbol');
        const symbol = symbolSelect.value === 'OTHER' ? 
            document.getElementById('customSymbol').value : 
            symbolSelect.value;
        
        const entry = parseFloat(document.getElementById('entryPrice').value);
        const stopLoss = parseFloat(document.getElementById('stopLoss').value);
        const takeProfit = parseFloat(document.getElementById('takeProfit').value);
        const exit = document.getElementById('exitPrice').value ? 
            parseFloat(document.getElementById('exitPrice').value) : null;
        const lotSize = parseFloat(document.getElementById('lotSize').value);
        const direction = document.getElementById('direction').value;
        
        // Validate required fields
        if (!symbol || !entry || !stopLoss || !takeProfit || !lotSize) {
            return;
        }
        
        // Calculate pips
        const slPips = App.calculatePips(entry, stopLoss, symbol);
        const tpPips = App.calculatePips(entry, takeProfit, symbol);
        
        // Calculate RR ratio
        const rrRatio = tpPips / slPips;
        
        // Update display
        document.getElementById('rrRatio').textContent = rrRatio.toFixed(2) + ':1';
        document.getElementById('slPips').textContent = slPips.toFixed(1);
        document.getElementById('tpPips').textContent = tpPips.toFixed(1);
        
        // Calculate P/L if exit price is provided
        if (exit) {
            const profitLoss = App.calculateProfitLoss(entry, exit, lotSize, direction, symbol);
            const plAmount = document.getElementById('plAmount');
            plAmount.textContent = App.formatCurrency(profitLoss);
            plAmount.className = profitLoss >= 0 ? 'text-success' : 'text-danger';
        } else {
            document.getElementById('plAmount').textContent = App.formatCurrency(0);
        }
        
    } catch (error) {
        console.warn('P/L calculation error:', error);
    }
}

function setupEventListeners() {
    // Manual P/L calculation button
    const calculateBtn = document.getElementById('calculatePL');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculatePL);
    }
    
    // Form submission
    const journalForm = document.getElementById('journalForm');
    if (journalForm) {
        journalForm.addEventListener('submit', saveTrade);
    }
    
    // Save draft button
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', saveAsDraft);
    }
    
    // Clear form button
    const clearFormBtn = document.getElementById('clearFormBtn');
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', clearForm);
    }
    
    // Quick save button in tab bar
    const quickSaveBtn = document.getElementById('quickSaveBtn');
    if (quickSaveBtn) {
        quickSaveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            saveTrade(new Event('submit'));
        });
    }
}

function saveTrade(e) {
    if (e) e.preventDefault();
    
    try {
        // Get form values
        const tradeData = getFormData();
        
        // Validate
        if (!validateTradeData(tradeData)) {
            return;
        }
        
        // Show loading state
        const submitBtn = document.querySelector('.btn-success[type="submit"]');
        if (submitBtn) {
            submitBtn.classList.add('loading');
        }
        
        // Calculate P/L if exit price exists
        if (tradeData.exitPrice) {
            tradeData.profitLoss = App.calculateProfitLoss(
                tradeData.entryPrice,
                tradeData.exitPrice,
                tradeData.lotSize,
                tradeData.direction,
                tradeData.symbol
            );
            
            // Calculate pips and RR
            const slPips = App.calculatePips(tradeData.entryPrice, tradeData.stopLoss, tradeData.symbol);
            const tpPips = App.calculatePips(tradeData.entryPrice, tradeData.takeProfit, tradeData.symbol);
            tradeData.rrRatio = (tpPips / slPips).toFixed(2);
            tradeData.slPips = slPips;
            tradeData.tpPips = tpPips;
        }
        
        // Save trade
        Storage.saveTrade(tradeData);
        
        // Show success message
        App.showNotification(
            `Trade ${tradeData.symbol} ${tradeData.direction} berhasil disimpan!`,
            'success'
        );
        
        // Clear form
        clearForm();
        
        // Reset to step 1
        switchStep(1);
        updateProgressIndicator(1);
        
        // Load updated recent trades
        loadRecentTrades();
        
        // Redirect to dashboard after delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        App.showNotification(`Gagal menyimpan: ${error.message}`, 'error');
        
        // Reset loading state
        const submitBtn = document.querySelector('.btn-success[type="submit"]');
        if (submitBtn) {
            submitBtn.classList.remove('loading');
        }
    }
}

function getFormData() {
    const symbolSelect = document.getElementById('symbol');
    const symbol = symbolSelect.value === 'OTHER' ? 
        document.getElementById('customSymbol').value : 
        symbolSelect.value;
    
    // Get emotions
    const emotionCheckboxes = document.querySelectorAll('input[name="emotion"]:checked');
    const emotions = Array.from(emotionCheckboxes).map(cb => cb.value);
    
    return {
        tradeDate: document.getElementById('tradeDate').value,
        symbol: symbol,
        timeframe: document.getElementById('timeframe').value,
        direction: document.getElementById('direction').value,
        lotSize: parseFloat(document.getElementById('lotSize').value),
        entryPrice: parseFloat(document.getElementById('entryPrice').value),
        stopLoss: parseFloat(document.getElementById('stopLoss').value),
        takeProfit: parseFloat(document.getElementById('takeProfit').value),
        exitPrice: document.getElementById('exitPrice').value ? 
            parseFloat(document.getElementById('exitPrice').value) : null,
        notes: document.getElementById('notes').value,
        screenshot: document.getElementById('screenshot').value,
        emotions: emotions
    };
}

function validateTradeData(tradeData) {
    // Required fields
    const required = ['tradeDate', 'symbol', 'direction', 'entryPrice', 'stopLoss', 'takeProfit', 'lotSize'];
    
    for (const field of required) {
        if (!tradeData[field]) {
            App.showNotification(`Field ${field} harus diisi`, 'error');
            return false;
        }
    }
    
    // Numeric validation
    if (tradeData.lotSize <= 0) {
        App.showNotification('Lot size harus lebih dari 0', 'error');
        return false;
    }
    
    if (tradeData.entryPrice <= 0) {
        App.showNotification('Entry price harus lebih dari 0', 'error');
        return false;
    }
    
    // Stop loss validation based on direction
    if (tradeData.direction === 'BUY') {
        if (tradeData.stopLoss >= tradeData.entryPrice) {
            App.showNotification('Stop loss harus di bawah entry price untuk BUY', 'error');
            return false;
        }
        if (tradeData.takeProfit <= tradeData.entryPrice) {
            App.showNotification('Take profit harus di atas entry price untuk BUY', 'error');
            return false;
        }
    } else {
        if (tradeData.stopLoss <= tradeData.entryPrice) {
            App.showNotification('Stop loss harus di atas entry price untuk SELL', 'error');
            return false;
        }
        if (tradeData.takeProfit >= tradeData.entryPrice) {
            App.showNotification('Take profit harus di bawah entry price untuk SELL', 'error');
            return false;
        }
    }
    
    return true;
}

function saveAsDraft() {
    try {
        const tradeData = getFormData();
        
        // Minimal validation for draft
        if (!tradeData.symbol || !tradeData.direction) {
            App.showNotification('Simbol dan arah diperlukan untuk draft', 'error');
            return;
        }
        
        Storage.saveDraft(tradeData);
        
        App.showNotification('Draft berhasil disimpan', 'success');
        
        // Update draft count in sidebar
        updateDraftCount();
        
    } catch (error) {
        App.showNotification('Gagal menyimpan draft', 'error');
    }
}

function clearForm() {
    App.confirmAction(
        'Hapus semua input form?',
        function() {
            const form = document.getElementById('journalForm');
            if (form) form.reset();
            
            // Reset custom symbol field
            const customSymbol = document.getElementById('customSymbol');
            if (customSymbol) {
                customSymbol.classList.add('hidden');
                customSymbol.value = '';
            }
            
            // Reset direction buttons
            document.querySelectorAll('.dir-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector('.dir-btn.buy').classList.add('active');
            document.getElementById('direction').value = 'BUY';
            
            // Reset date
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            const dateInput = document.getElementById('tradeDate');
            if (dateInput) {
                dateInput.value = localDateTime;
            }
            
            // Reset P/L calculator
            document.getElementById('rrRatio').textContent = '1:1';
            document.getElementById('slPips').textContent = '0';
            document.getElementById('tpPips').textContent = '0';
            document.getElementById('plAmount').textContent = App.formatCurrency(0);
            document.getElementById('plAmount').className = '';
            
            // Reset emotions
            document.querySelectorAll('input[name="emotion"]').forEach(cb => {
                cb.checked = false;
            });
            
            // Reset to step 1
            switchStep(1);
            updateProgressIndicator(1);
            
            App.showNotification('Form telah direset', 'success');
        }
    );
}

function loadRecentTrades() {
    const trades = Storage.getFilteredTrades({ sortBy: 'date-desc' });
    const recentTrades = trades.slice(0, 3);
    const container = document.getElementById('recentPreview');
    
    if (!container) return;
    
    if (recentTrades.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Belum ada trade</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentTrades.map(trade => `
        <div class="preview-item" onclick="window.location.href='history.html?trade=${trade.id}'">
            <div class="preview-symbol">${trade.symbol}</div>
            <div class="preview-details">
                <span>${trade.direction} • ${trade.timeframe}</span>
                <span>${trade.exitPrice ? 
                    `<span class="${trade.profitLoss >= 0 ? 'text-success' : 'text-danger'}">
                        ${App.formatCurrency(trade.profitLoss)}
                    </span>` : 
                    '<span class="text-info">OPEN</span>'}
                </span>
            </div>
        </div>
    `).join('');
}

function checkForDraft() {
    // Check URL parameters for draft ID
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draft');
    
    if (draftId) {
        loadDraft(draftId);
    }
}

function loadDraft(draftId) {
    const drafts = Storage.getDrafts();
    const draft = drafts.find(d => d.id === draftId);
    
    if (!draft) {
        App.showNotification('Draft tidak ditemukan', 'warning');
        return;
    }
    
    // Load draft data into form
    document.getElementById('tradeDate').value = draft.tradeDate || '';
    document.getElementById('symbol').value = draft.symbol || '';
    document.getElementById('timeframe').value = draft.timeframe || 'H1';
    document.getElementById('direction').value = draft.direction || 'BUY';
    document.getElementById('lotSize').value = draft.lotSize || 0.1;
    document.getElementById('entryPrice').value = draft.entryPrice || '';
    document.getElementById('stopLoss').value = draft.stopLoss || '';
    document.getElementById('takeProfit').value = draft.takeProfit || '';
    document.getElementById('exitPrice').value = draft.exitPrice || '';
    document.getElementById('notes').value = draft.notes || '';
    document.getElementById('screenshot').value = draft.screenshot || '';
    
    // Update direction buttons
    document.querySelectorAll('.dir-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.direction === draft.direction) {
            btn.classList.add('active');
        }
    });
    
    // Update emotions
    if (draft.emotions) {
        document.querySelectorAll('input[name="emotion"]').forEach(cb => {
            cb.checked = draft.emotions.includes(cb.value);
        });
    }
    
    // Recalculate P/L
    calculatePL();
    
    App.showNotification('Draft dimuat', 'success');
}

function updateDraftCount() {
    const drafts = Storage.getDrafts();
    const draftCountElement = document.getElementById('draftCount');
    if (draftCountElement) {
        draftCountElement.textContent = drafts.length;
    }
}

// Initialize draft count
updateDraftCount();

// Export functions
window.calculatePL = calculatePL;
window.clearForm = clearForm;
