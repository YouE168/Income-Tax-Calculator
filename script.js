/**
 * Income Tax Calculator
 * A comprehensive tax calculation tool with history tracking
 */

class TaxCalculator {
    constructor() {
        // 2024 Federal Tax Brackets
        this.taxBrackets2024 = {
            single: [
                { min: 0, max: 11000, rate: 0.10 },
                { min: 11000, max: 44725, rate: 0.12 },
                { min: 44725, max: 95375, rate: 0.22 },
                { min: 95375, max: 182050, rate: 0.24 },
                { min: 182050, max: 231250, rate: 0.32 },
                { min: 231250, max: 578125, rate: 0.35 },
                { min: 578125, max: Infinity, rate: 0.37 }
            ],
            marriedJointly: [
                { min: 0, max: 22000, rate: 0.10 },
                { min: 22000, max: 89450, rate: 0.12 },
                { min: 89450, max: 190750, rate: 0.22 },
                { min: 190750, max: 364200, rate: 0.24 },
                { min: 364200, max: 462500, rate: 0.32 },
                { min: 462500, max: 693750, rate: 0.35 },
                { min: 693750, max: Infinity, rate: 0.37 }
            ]
        };
        
        // 2024 Standard Deductions
        this.standardDeductions2024 = {
            single: 13850,
            marriedJointly: 27700,
            marriedSeparately: 13850,
            headOfHousehold: 20800
        };
        
        // Load history from localStorage
        this.history = JSON.parse(localStorage.getItem('taxHistory')) || [];
        
        // Initialize the application
        this.initializeEventListeners();
        this.displayHistory();
    }

    /**
     * Set up event listeners for form submission and clear history
     */
    initializeEventListeners() {
        const form = document.getElementById('taxForm');
        const clearHistoryBtn = document.getElementById('clearHistory');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateTax();
        });
        
        clearHistoryBtn.addEventListener('click', () => {
            this.clearHistory();
        });
    }

    /**
     * Main tax calculation method
     */
    calculateTax() {
        // Get form values
        const income = parseFloat(document.getElementById('income').value) || 0;
        const filingStatus = document.getElementById('filingStatus').value;
        const customDeductions = parseFloat(document.getElementById('deductions').value) || 0;
        const state = document.getElementById('state').value;

        // Validate required inputs
        if (!income || !filingStatus) {
            alert('Please enter your income and filing status.');
            return;
        }

        // Calculate deductions
        const standardDeduction = this.standardDeductions2024[filingStatus] || 13850;
        const deductions = customDeductions || standardDeduction;
        
        // Calculate taxable income
        const taxableIncome = Math.max(0, income - deductions);
        
        // Get appropriate tax brackets
        const brackets = this.taxBrackets2024[filingStatus] || this.taxBrackets2024.single;
        
        // Calculate taxes
        const federalTax = this.calculateFederalTax(taxableIncome, brackets);
        const stateTax = this.calculateStateTax(income, state);
        
        // Calculate totals
        const totalTax = federalTax + stateTax;
        const afterTaxIncome = income - totalTax;
        
        // Display results
        this.displayResults({
            income,
            filingStatus,
            deductions,
            taxableIncome,
            federalTax,
            stateTax,
            totalTax,
            afterTaxIncome,
            brackets
        });
        
        // Save to history
        this.saveToHistory({
            date: new Date().toLocaleDateString(),
            income,
            filingStatus,
            federalTax,
            stateTax,
            totalTax,
            afterTaxIncome
        });
    }

    /**
     * Calculate federal tax using progressive tax brackets
     * @param {number} taxableIncome - The taxable income amount
     * @param {Array} brackets - Tax brackets for the filing status
     * @returns {number} Federal tax amount
     */
    calculateFederalTax(taxableIncome, brackets) {
        let tax = 0;
        
        for (const bracket of brackets) {
            if (taxableIncome > bracket.min) {
                const taxableAtThisBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
                tax += taxableAtThisBracket * bracket.rate;
            }
        }
        
        return Math.round(tax * 100) / 100;
    }

    /**
     * Calculate estimated state tax
     * @param {number} income - Gross income
     * @param {string} state - State tax category
     * @returns {number} State tax amount
     */
    calculateStateTax(income, state) {
        const stateRates = {
            none: 0,
            low: 0.03,
            medium: 0.06,
            high: 0.10
        };
        
        return Math.round(income * (stateRates[state] || 0) * 100) / 100;
    }

    /**
     * Display calculation results in the UI
     * @param {Object} results - Calculation results object
     */
    displayResults(results) {
        // Update result cards
        document.getElementById('federalTax').textContent = `$${results.federalTax.toLocaleString()}`;
        document.getElementById('stateTax').textContent = `$${results.stateTax.toLocaleString()}`;
        document.getElementById('totalTax').textContent = `$${results.totalTax.toLocaleString()}`;
        document.getElementById('afterTaxIncome').textContent = `$${results.afterTaxIncome.toLocaleString()}`;
        
        // Show detailed breakdown
        this.displayBreakdown(results);
        document.getElementById('breakdown').style.display = 'block';
    }

    /**
     * Display detailed tax breakdown
     * @param {Object} results - Calculation results object
     */
    displayBreakdown(results) {
        const breakdownContainer = document.getElementById('breakdownItems');
        const effectiveRate = ((results.totalTax / results.income) * 100).toFixed(2);
        const marginalRate = this.getMarginalRate(results.taxableIncome, results.brackets);
        
        breakdownContainer.innerHTML = `
            <div class="breakdown-item">
                <span>Gross Income:</span>
                <span>$${results.income.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
                <span>Deductions:</span>
                <span>$${results.deductions.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
                <span>Taxable Income:</span>
                <span>$${results.taxableIncome.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
                <span>Effective Tax Rate:</span>
                <span>${effectiveRate}%</span>
            </div>
            <div class="breakdown-item">
                <span>Marginal Tax Rate:</span>
                <span>${(marginalRate * 100).toFixed(1)}%</span>
            </div>
        `;
    }

    /**
     * Get the marginal tax rate for given taxable income
     * @param {number} taxableIncome - Taxable income amount
     * @param {Array} brackets - Tax brackets
     * @returns {number} Marginal tax rate
     */
    getMarginalRate(taxableIncome, brackets) {
        for (const bracket of brackets) {
            if (taxableIncome >= bracket.min && taxableIncome < bracket.max) {
                return bracket.rate;
            }
        }
        return brackets[brackets.length - 1].rate;
    }

    /**
     * Save calculation to history
     * @param {Object} calculation - Calculation data to save
     */
    saveToHistory(calculation) {
        this.history.unshift(calculation);
        
        // Keep only last 10 calculations
        if (this.history.length > 10) {
            this.history.pop();
        }
        
        localStorage.setItem('taxHistory', JSON.stringify(this.history));
        this.displayHistory();
    }

    /**
     * Display calculation history in the UI
     */
    displayHistory() {
        const historyContainer = document.getElementById('historyContainer');
        const clearButton = document.getElementById('clearHistory');
        
        if (this.history.length === 0) {
            historyContainer.innerHTML = '<p style="color: #999; text-align: center;">No calculations yet. Start by calculating your tax above!</p>';
            clearButton.style.display = 'none';
            return;
        }
        
        historyContainer.innerHTML = this.history.map(calc => `
            <div class="history-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>Date:</strong> ${calc.date} | 
                        <strong>Income:</strong> $${calc.income.toLocaleString()} | 
                        <strong>Status:</strong> ${calc.filingStatus}
                    </div>
                    <div style="text-align: right;">
                        <div><strong>Total Tax:</strong> $${calc.totalTax.toLocaleString()}</div>
                        <div style="color: #007bff;"><strong>After-Tax:</strong> $${calc.afterTaxIncome.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        clearButton.style.display = 'block';
    }

    /**
     * Clear calculation history
     */
    clearHistory() {
        this.history = [];
        localStorage.removeItem('taxHistory');
        this.displayHistory();
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TaxCalculator();
});