// frontend/assets/js/finance.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      window.location.href = 'login.html';
      return;
    }
  
    // Check for URL parameters
    const urlParams = window.app.getUrlParams();
    if (urlParams.action === 'statement') {
      loadAccountStatement();
    } else if (urlParams.action === 'mobile-banking') {
      showMobileBankingModal();
    } else {
      // Load transactions by default
      loadFinancialDashboard();
      loadTransactions();
    }
  
    // Set up event listeners
    setupEventListeners();
  });
  
  function setupEventListeners() {
    // Statement button
    const statementBtn = document.getElementById('statementBtn');
    if (statementBtn) {
      statementBtn.addEventListener('click', () => {
        loadAccountStatement();
      });
    }
    
    // Mobile banking button
    const mobileBankingBtn = document.getElementById('mobileBankingBtn');
    if (mobileBankingBtn) {
      mobileBankingBtn.addEventListener('click', () => {
        showMobileBankingModal();
      });
    }
    
    // Date range filter
    const dateFilterBtn = document.getElementById('dateFilterBtn');
    if (dateFilterBtn) {
      dateFilterBtn.addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (startDate && endDate) {
          loadTransactions(startDate, endDate);
        } else {
          window.app.showToast('Please select start and end dates', 'warning');
        }
      });
    }
    
    // Reset filter button
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    if (resetFilterBtn) {
      resetFilterBtn.addEventListener('click', () => {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        loadTransactions();
      });
    }
  }
  
  async function loadFinancialDashboard() {
    try {
      window.app.showLoading();
      
      const response = await fetch('http://localhost:5000/api/financial/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load financial dashboard');
      }
      
      const data = await response.json();
      const dashboardData = data.data;
      
      // Update UI with dashboard data
      updateDashboardUI(dashboardData);
      
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading financial dashboard:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load financial dashboard', 'error');
    }
  }
  
  function updateDashboardUI(data) {
    // Update financial summary
    document.getElementById('totalSavings').textContent = window.app.formatCurrency(data.totalSavings);
    document.getElementById('shareCapital').textContent = window.app.formatCurrency(data.shareCapital);
    document.getElementById('outstandingLoans').textContent = window.app.formatCurrency(data.totalOutstandingLoans);
    
    // Update next due payments
    const paymentsContainer = document.getElementById('nextDuePayments');
    if (paymentsContainer) {
      paymentsContainer.innerHTML = '';
      
      if (data.nextDuePayments && data.nextDuePayments.length > 0) {
        data.nextDuePayments.forEach(payment => {
          const dueDate = new Date(payment.dueDate);
          const today = new Date();
          const diffTime = dueDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          const paymentElement = document.createElement('div');
          paymentElement.style.padding = '15px';
          paymentElement.style.borderBottom = '1px solid var(--border-color)';
          
          paymentElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <strong>Loan Repayment</strong>
              <span>${window.app.formatCurrency(payment.amount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--text-light); font-size: 0.9rem;">
              <span>${payment.loanType.charAt(0).toUpperCase() + payment.loanType.slice(1)} Loan - Installment #${payment.installmentNumber}</span>
              <span>${diffDays <= 0 ? 'Due today' : diffDays === 1 ? 'Due tomorrow' : `Due in ${diffDays} days`}</span>
            </div>
            <div style="margin-top: 10px;">
              <button class="btn btn-small" style="width: 100%;" onclick="window.location.href='loans.html?action=repay&id=${payment.loanId}'">Pay Now</button>
            </div>
          `;
          
          paymentsContainer.appendChild(paymentElement);
        });
      } else {
        paymentsContainer.innerHTML = `
          <div style="padding: 15px; text-align: center; color: var(--text-light);">
            No upcoming payments
          </div>
        `;
      }
    }
    
    // Update recent transactions
    const recentTransactionsContainer = document.getElementById('recentTransactions');
    if (recentTransactionsContainer && data.recentTransactions) {
      recentTransactionsContainer.innerHTML = '';
      
      data.recentTransactions.forEach(transaction => {
        const row = createTransactionRow(transaction);
        recentTransactionsContainer.appendChild(row);
      });
    }
  }
  
  async function loadTransactions(startDate = null, endDate = null) {
    try {
      let url = 'http://localhost:5000/api/financial/transactions';
      
      // Add date range filter if provided
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load transactions');
      }
      
      const data = await response.json();
      const transactions = data.data;
      
      // Update UI with transactions
      updateTransactionsUI(transactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      window.app.showToast('Failed to load transactions', 'error');
    }
  }
  
  function updateTransactionsUI(transactions) {
    const transactionsContainer = document.getElementById('transactionsTableBody');
    if (!transactionsContainer) return;
    
    // Clear container
    transactionsContainer.innerHTML = '';
    
    if (transactions.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="5" style="text-align: center; padding: 20px;">
          No transactions found
        </td>
      `;
      transactionsContainer.appendChild(row);
      return;
    }
    
    // Add transactions to table
    transactions.forEach(transaction => {
      const row = createTransactionRow(transaction);
      transactionsContainer.appendChild(row);
    });
  }
  
  function createTransactionRow(transaction) {
    const row = document.createElement('tr');
    
    const date = new Date(transaction.transactionDate);
    const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    
    // Determine if amount should be shown as positive or negative
    let amountClass = '';
    if (['saving-deposit', 'loan-disbursement', 'dividend-payment'].includes(transaction.transactionType)) {
      amountClass = 'positive';
    } else if (['saving-withdrawal', 'loan-repayment', 'fee-payment'].includes(transaction.transactionType)) {
      amountClass = 'negative';
    }
    
    // Format transaction type for display
    const transactionTypeDisplay = window.app.formatTransactionType(transaction.transactionType);
    
    row.innerHTML = `
      <td>${formattedDate}</td>
      <td>
        <span class="transaction-type">${transactionTypeDisplay}</span>
        <div style="font-size: 0.9rem; color: var(--text-light);">${transaction.description || ''}</div>
      </td>
      <td class="transaction-amount ${amountClass}">
        ${amountClass === 'negative' ? '-' : ''}${window.app.formatCurrency(transaction.amount)}
      </td>
      <td>${window.app.formatTransactionType(transaction.paymentMethod)}</td>
      <td>
        <span class="transaction-status ${transaction.status}">${transaction.status}</span>
      </td>
    `;
    
    return row;
  }
  
  async function loadAccountStatement(startDate = null, endDate = null) {
    try {
      window.app.showLoading();
      
      // Get current date if no end date provided
      if (!endDate) {
        const today = new Date();
        endDate = today.toISOString().split('T')[0];
      }
      
      // Get date 30 days ago if no start date provided
      if (!startDate) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        startDate = thirtyDaysAgo.toISOString().split('T')[0];
      }
      
      const response = await fetch(`http://localhost:5000/api/financial/statement?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load account statement');
      }
      
      const data = await response.json();
      const statement = data.data;
      
      // Update UI with statement
      updateStatementUI(statement, startDate, endDate);
      
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading account statement:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load account statement', 'error');
    }
  }
  
  function updateStatementUI(statement, startDate, endDate) {
    // Show statement section
    document.getElementById('transactionsSection').style.display = 'none';
    document.getElementById('statementSection').style.display = 'block';
    
    // Update statement header
    document.getElementById('statementDateRange').textContent = `${window.app.formatDate(startDate)} - ${window.app.formatDate(endDate)}`;
    document.getElementById('statementMemberName').textContent = statement.summary.memberName;
    document.getElementById('statementMemberNumber').textContent = statement.summary.memberNumber;
    
    // Update statement summary
    document.getElementById('openingBalance').textContent = window.app.formatCurrency(statement.summary.openingBalance);
    document.getElementById('closingBalance').textContent = window.app.formatCurrency(statement.summary.closingBalance);
    document.getElementById('totalDeposits').textContent = window.app.formatCurrency(statement.summary.totalDeposits);
    document.getElementById('totalWithdrawals').textContent = window.app.formatCurrency(statement.summary.totalWithdrawals);
    document.getElementById('totalLoanDisbursements').textContent = window.app.formatCurrency(statement.summary.totalLoanDisbursements);
    document.getElementById('totalLoanRepayments').textContent = window.app.formatCurrency(statement.summary.totalLoanRepayments);
    
    // Update statement transactions
    const transactionsTableBody = document.getElementById('statementTransactionsBody');
    transactionsTableBody.innerHTML = '';
    
    if (statement.transactions.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="5" style="text-align: center; padding: 20px;">
          No transactions in this period
        </td>
      `;
      transactionsTableBody.appendChild(row);
    } else {
      statement.transactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        const date = new Date(transaction.transactionDate);
        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        
        // Determine if amount is credit or debit
        let amountClass = '';
        let amountPrefix = '';
        if (['saving-deposit', 'loan-disbursement', 'dividend-payment'].includes(transaction.transactionType)) {
          amountClass = 'positive';
          amountPrefix = '+';
        } else if (['saving-withdrawal', 'loan-repayment', 'fee-payment'].includes(transaction.transactionType)) {
          amountClass = 'negative';
          amountPrefix = '-';
        }
        
        row.innerHTML = `
          <td>${formattedDate}</td>
          <td>${window.app.formatTransactionType(transaction.transactionType)}</td>
          <td>${transaction.description || ''}</td>
          <td class="transaction-amount ${amountClass}">${amountPrefix}${window.app.formatCurrency(transaction.amount)}</td>
          <td>${window.app.formatCurrency(transaction.balance)}</td>
        `;
        
        transactionsTableBody.appendChild(row);
      });
    }
    
    // Update statement date filter
    document.getElementById('statementStartDate').value = startDate;
    document.getElementById('statementEndDate').value = endDate;
    
    // Add event listener to statement date filter button
    document.getElementById('updateStatementBtn').addEventListener('click', () => {
      const newStartDate = document.getElementById('statementStartDate').value;
      const newEndDate = document.getElementById('statementEndDate').value;
      
      if (newStartDate && newEndDate) {
        loadAccountStatement(newStartDate, newEndDate);
      } else {
        window.app.showToast('Please select start and end dates', 'warning');
      }
    });
    
    // Add event listener to print statement button
    document.getElementById('printStatementBtn').addEventListener('click', () => {
      window.print();
    });
    
    // Add event listener to export statement button
    document.getElementById('exportStatementBtn').addEventListener('click', () => {
      // In a real application, this would generate a PDF or CSV
      window.app.showToast('Statement export functionality would be implemented here', 'info');
    });
    
    // Add event listener to back to transactions button
    document.getElementById('backToTransactionsBtn').addEventListener('click', () => {
      document.getElementById('statementSection').style.display = 'none';
      document.getElementById('transactionsSection').style.display = 'block';
    });
  }
  
  function showMobileBankingModal() {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <form id="mobileBankingForm">
        <div class="form-group">
          <label for="phoneNumber">Phone Number</label>
          <input type="tel" id="phoneNumber" name="phoneNumber" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="transactionType">Transaction Type</label>
          <select id="transactionType" name="transactionType" class="form-control" required>
            <option value="saving-deposit">Saving Deposit</option>
            <option value="loan-repayment">Loan Repayment</option>
          </select>
        </div>
        
        <div id="loanSelector" class="form-group" style="display: none;">
          <label for="destinationId">Select Loan</label>
          <select id="destinationId" name="destinationId" class="form-control"></select>
        </div>
        
        <div class="form-group">
          <label for="amount">Amount (KES)</label>
          <input type="number" id="amount" name="amount" min="100" step="100" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="notes">Notes (Optional)</label>
          <textarea id="notes" name="notes" class="form-control" rows="2"></textarea>
        </div>
        
        <div class="alert alert-info">
          <p>You will receive an STK push to your phone to complete the payment.</p>
        </div>
      </form>
    `;
    
    window.app.createModal('Mobile Banking', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Proceed',
        class: 'btn',
        handler: () => processMobileBanking()
      }
    ]);
    
    // Set default phone number if available
    const memberData = JSON.parse(localStorage.getItem('memberData') || '{}');
    if (memberData.phone) {
      document.getElementById('phoneNumber').value = memberData.phone;
    }
    
    // Add event listener for transaction type change
    document.getElementById('transactionType').addEventListener('change', function() {
      const loanSelector = document.getElementById('loanSelector');
      if (this.value === 'loan-repayment') {
        loanSelector.style.display = 'block';
        loadActiveLoans();
      } else {
        loanSelector.style.display = 'none';
      }
    });
  }
  
  async function loadActiveLoans() {
    try {
      const response = await fetch('http://localhost:5000/api/loans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load loans');
      }
      
      const data = await response.json();
      const loans = data.data.filter(loan => 
        loan.status === 'disbursed' || loan.status === 'repaying'
      );
      
      const loanSelector = document.getElementById('destinationId');
      loanSelector.innerHTML = '';
      
      if (loans.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No active loans';
        option.disabled = true;
        loanSelector.appendChild(option);
      } else {
        loans.forEach(loan => {
          const option = document.createElement('option');
          option.value = loan._id;
          option.textContent = `${loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1)} Loan - ${window.app.formatCurrency(loan.amount)}`;
          loanSelector.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading loans:', error);
      window.app.showToast('Failed to load loans', 'error');
    }
  }
  
  async function processMobileBanking() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const transactionType = document.getElementById('transactionType').value;
    const amount = document.getElementById('amount').value;
    const notes = document.getElementById('notes').value;
    
    // Get destination ID for loan repayment
    let destinationId = null;
    if (transactionType === 'loan-repayment') {
      destinationId = document.getElementById('destinationId').value;
    }
    
    try {
      window.app.showLoading();
      
      const response = await fetch('http://localhost:5000/api/financial/mobile-banking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          transactionType,
          amount,
          paymentMethod: 'mobile-money',
          destinationId,
          notes
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process mobile banking transaction');
      }
      
      window.app.hideLoading();
      window.app.closeModal();
      
      // Show success modal
      const successModalContent = document.createElement('div');
      successModalContent.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 4rem; color: var(--success-color); margin-bottom: 20px;">
            <i class="fas fa-check-circle"></i>
          </div>
          <h3 style="margin-bottom: 20px;">Payment Request Sent</h3>
          <p>An STK push has been sent to your phone (${phoneNumber}). Please complete the payment by entering your M-Pesa PIN when prompted.</p>
        </div>
      `;
      
      window.app.createModal('', successModalContent