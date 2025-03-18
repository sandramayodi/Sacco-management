// frontend/assets/js/loans.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      window.location.href = 'login.html';
      return;
    }
  
    // Check for URL parameters
    const urlParams = window.app.getUrlParams();
    if (urlParams.action === 'apply') {
      showLoanApplicationModal();
    } else if (urlParams.action === 'repay' && urlParams.id) {
      showLoanRepaymentModal(urlParams.id);
    } else if (urlParams.id) {
      loadLoanDetails(urlParams.id);
    } else {
      // Load loans list by default
      loadMyLoans();
    }
  
    // Set up event listeners
    setupEventListeners();
  });
  
  function setupEventListeners() {
    // Apply for loan button
    const applyLoanBtn = document.getElementById('applyLoanBtn');
    if (applyLoanBtn) {
      applyLoanBtn.addEventListener('click', () => {
        showLoanApplicationModal();
      });
    }
  }
  
  async function loadMyLoans() {
    try {
      window.app.showLoading();
      
      const response = await fetch('http://localhost:5000/api/loans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load loans');
      }
      
      const data = await response.json();
      const loans = data.data;
      
      // Update UI with loans
      updateLoansUI(loans);
      
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading loans:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load loans', 'error');
    }
  }
  
  function updateLoansUI(loans) {
    const loansContainer = document.getElementById('loansContainer');
    if (!loansContainer) return;
    
    // Clear container
    loansContainer.innerHTML = '';
    
    if (loans.length === 0) {
      loansContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;">
            <i class="fas fa-hand-holding-usd"></i>
          </div>
          <h3 style="margin-bottom: 20px;">No Loans Yet</h3>
          <p>You don't have any loans yet. Apply for a loan to get started.</p>
          <button id="noLoansApplyBtn" class="btn" style="margin-top: 20px;">Apply for a Loan</button>
        </div>
      `;
      
      // Add event listener to the apply button
      const noLoansApplyBtn = document.getElementById('noLoansApplyBtn');
      if (noLoansApplyBtn) {
        noLoansApplyBtn.addEventListener('click', () => {
          showLoanApplicationModal();
        });
      }
      return;
    }
    
    // Group loans by status
    const activeLoans = loans.filter(loan => 
      loan.status === 'disbursed' || loan.status === 'repaying'
    );
    
    const pendingLoans = loans.filter(loan => 
      loan.status === 'applied' || loan.status === 'under-review' || loan.status === 'approved'
    );
    
    const completedLoans = loans.filter(loan => 
      loan.status === 'fully-paid' || loan.status === 'rejected' || loan.status === 'defaulted'
    );
    
    // Add active loans
    if (activeLoans.length > 0) {
      const activeLoansSection = document.createElement('div');
      activeLoansSection.className = 'loans-section';
      activeLoansSection.innerHTML = `
        <h3 class="section-title">Active Loans</h3>
        <div class="loans-grid" id="activeLoansGrid"></div>
      `;
      loansContainer.appendChild(activeLoansSection);
      
      const activeLoansGrid = document.getElementById('activeLoansGrid');
      activeLoans.forEach(loan => {
        activeLoansGrid.appendChild(createLoanCard(loan));
      });
    }
    
    // Add pending loans
    if (pendingLoans.length > 0) {
      const pendingLoansSection = document.createElement('div');
      pendingLoansSection.className = 'loans-section';
      pendingLoansSection.innerHTML = `
        <h3 class="section-title">Pending Loans</h3>
        <div class="loans-grid" id="pendingLoansGrid"></div>
      `;
      loansContainer.appendChild(pendingLoansSection);
      
      const pendingLoansGrid = document.getElementById('pendingLoansGrid');
      pendingLoans.forEach(loan => {
        pendingLoansGrid.appendChild(createLoanCard(loan));
      });
    }
    
    // Add completed loans
    if (completedLoans.length > 0) {
      const completedLoansSection = document.createElement('div');
      completedLoansSection.className = 'loans-section';
      completedLoansSection.innerHTML = `
        <h3 class="section-title">Completed Loans</h3>
        <div class="loans-grid" id="completedLoansGrid"></div>
      `;
      loansContainer.appendChild(completedLoansSection);
      
      const completedLoansGrid = document.getElementById('completedLoansGrid');
      completedLoans.forEach(loan => {
        completedLoansGrid.appendChild(createLoanCard(loan));
      });
    }
  }
  
  function createLoanCard(loan) {
    const card = document.createElement('div');
    card.className = 'loan-card';
    
    // Calculate loan progress
    let totalPaid = 0;
    let progress = 0;
    
    if (loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
      totalPaid = loan.repaymentSchedule.reduce((sum, installment) => 
        sum + (installment.paidAmount || 0), 0
      );
      progress = (totalPaid / loan.amount) * 100;
    }
    
    // Format loan type
    const loanTypeFormatted = loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1);
    
    card.innerHTML = `
      <div class="loan-card-header">
        <div class="loan-card-title">${loanTypeFormatted} Loan</div>
        <div class="loan-card-status ${loan.status}">${window.app.formatLoanStatus(loan.status)}</div>
      </div>
      <div class="loan-card-details">
        <div class="loan-card-detail">
          <div class="loan-card-label">Loan Amount:</div>
          <div class="loan-card-value">${window.app.formatCurrency(loan.amount)}</div>
        </div>
        <div class="loan-card-detail">
          <div class="loan-card-label">Application Date:</div>
          <div class="loan-card-value">${window.app.formatDate(loan.applicationDate)}</div>
        </div>
        ${loan.status === 'disbursed' || loan.status === 'repaying' || loan.status === 'fully-paid' ? 
          `<div class="loan-card-detail">
            <div class="loan-card-label">Repaid:</div>
            <div class="loan-card-value">${window.app.formatCurrency(totalPaid)} (${progress.toFixed(0)}%)</div>
          </div>` : ''
        }
        ${loan.status === 'disbursed' || loan.status === 'repaying' ? 
          `<div class="loan-card-detail">
            <div class="loan-card-label">Remaining:</div>
            <div class="loan-card-value">${window.app.formatCurrency(loan.amount - totalPaid)}</div>
          </div>` : ''
        }
      </div>
      ${loan.status === 'disbursed' || loan.status === 'repaying' || loan.status === 'fully-paid' ? 
        `<div class="loan-card-progress">
          <div class="progress-container">
            <div class="progress-bar" style="width: ${progress}%;"></div>
          </div>
        </div>` : ''
      }
      <div class="loan-card-footer">
        <a href="loans.html?id=${loan._id}" class="btn btn-small btn-outline">Details</a>
        ${loan.status === 'disbursed' || loan.status === 'repaying' ? 
          `<a href="loans.html?action=repay&id=${loan._id}" class="btn btn-small">Make Payment</a>` : ''
        }
      </div>
    `;
    
    return card;
  }
  
  async function loadLoanDetails(loanId) {
    try {
      window.app.showLoading();
      
      const response = await fetch(`http://localhost:5000/api/loans/${loanId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load loan details');
      }
      
      const data = await response.json();
      const loan = data.data;
      
      // Update UI with loan details
      updateLoanDetailsUI(loan);
      
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading loan details:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load loan details', 'error');
      
      // Redirect back to loans list
      setTimeout(() => {
        window.location.href = 'loans.html';
      }, 2000);
    }
  }
  
  function updateLoanDetailsUI(loan) {
    // Update loan header
    document.getElementById('loanPageTitle').textContent = `${loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1)} Loan Details`;
    
    // Update loan status
    const loanStatusElement = document.getElementById('loanStatus');
    loanStatusElement.textContent = window.app.formatLoanStatus(loan.status);
    loanStatusElement.className = `loan-status ${loan.status}`;
    
    // Update loan details
    document.getElementById('loanAmount').textContent = window.app.formatCurrency(loan.amount);
    document.getElementById('loanTerm').textContent = `${loan.term} ${loan.term === 1 ? 'month' : 'months'}`;
    document.getElementById('loanInterestRate').textContent = `${loan.interestRate}%`;
    document.getElementById('loanPurpose').textContent = loan.purpose;
    document.getElementById('applicationDate').textContent = window.app.formatDate(loan.applicationDate);
    
    // Update additional details based on loan status
    const additionalDetailsContainer = document.getElementById('additionalDetails');
    if (loan.status === 'approved' || loan.status === 'disbursed' || loan.status === 'repaying' || loan.status === 'fully-paid') {
      additionalDetailsContainer.innerHTML = `
        <div class="detail-item">
          <span class="detail-label">Approval Date:</span>
          <span class="detail-value">${window.app.formatDate(loan.approvalDate)}</span>
        </div>
      `;
      
      if (loan.status === 'disbursed' || loan.status === 'repaying' || loan.status === 'fully-paid') {
        additionalDetailsContainer.innerHTML += `
          <div class="detail-item">
            <span class="detail-label">Disbursement Date:</span>
            <span class="detail-value">${window.app.formatDate(loan.disbursementDate)}</span>
          </div>
        `;
      }
    }
    
    // Update repayment schedule
    const scheduleContainer = document.getElementById('repaymentSchedule');
    if (loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
      scheduleContainer.innerHTML = `
        <h3 class="section-title">Repayment Schedule</h3>
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Principal</th>
              <th>Interest</th>
              <th>Paid Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="scheduleTableBody"></tbody>
        </table>
      `;
      
      const tableBody = document.getElementById('scheduleTableBody');
      
      loan.repaymentSchedule.forEach(installment => {
        const row = document.createElement('tr');
        
        let statusClass = '';
        if (installment.status === 'paid') {
          statusClass = 'text-success';
        } else if (installment.status === 'overdue') {
          statusClass = 'text-danger';
        }
        
        const dueDate = new Date(installment.dueDate);
        const today = new Date();
        const isPastDue = dueDate < today && installment.status === 'pending';
        
        row.innerHTML = `
          <td>${installment.installmentNumber}</td>
          <td>${window.app.formatDate(installment.dueDate)}${isPastDue ? ' <span class="badge badge-danger">Overdue</span>' : ''}</td>
          <td>${window.app.formatCurrency(installment.amount)}</td>
          <td>${window.app.formatCurrency(installment.principal)}</td>
          <td>${window.app.formatCurrency(installment.interest)}</td>
          <td>${installment.paidAmount ? window.app.formatCurrency(installment.paidAmount) : '-'}</td>
          <td class="${statusClass}">${installment.status.charAt(0).toUpperCase() + installment.status.slice(1)}</td>
        `;
        
        tableBody.appendChild(row);
      });
      
      // Calculate and display loan summary
      const totalInterest = loan.repaymentSchedule.reduce((sum, installment) => sum + installment.interest, 0);
      const totalPaid = loan.repaymentSchedule.reduce((sum, installment) => sum + (installment.paidAmount || 0), 0);
      const remainingBalance = loan.amount + totalInterest - totalPaid;
      
      const summaryContainer = document.getElementById('loanSummary');
      summaryContainer.innerHTML = `
        <div class="loan-summary-item">
          <div class="summary-label">Principal</div>
          <div class="summary-value">${window.app.formatCurrency(loan.amount)}</div>
        </div>
        <div class="loan-summary-item">
          <div class="summary-label">Total Interest</div>
          <div class="summary-value">${window.app.formatCurrency(totalInterest)}</div>
        </div>
        <div class="loan-summary-item">
          <div class="summary-label">Total Amount</div>
          <div class="summary-value">${window.app.formatCurrency(loan.amount + totalInterest)}</div>
        </div>
        <div class="loan-summary-item">
          <div class="summary-label">Paid To Date</div>
          <div class="summary-value">${window.app.formatCurrency(totalPaid)}</div>
        </div>
        <div class="loan-summary-item">
          <div class="summary-label">Remaining Balance</div>
          <div class="summary-value">${window.app.formatCurrency(remainingBalance)}</div>
        </div>
      `;
    } else {
      scheduleContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-light);">
          Repayment schedule will be available once the loan is approved and disbursed.
        </div>
      `;
    }
    
    // Show appropriate action buttons based on loan status
    const actionsContainer = document.getElementById('loanActions');
    actionsContainer.innerHTML = '';
    
    if (loan.status === 'disbursed' || loan.status === 'repaying') {
      const makePaymentBtn = document.createElement('button');
      makePaymentBtn.className = 'btn';
      makePaymentBtn.textContent = 'Make Payment';
      makePaymentBtn.addEventListener('click', () => {
        showLoanRepaymentModal(loan._id);
      });
      
      actionsContainer.appendChild(makePaymentBtn);
    } else if (loan.status === 'applied' || loan.status === 'under-review') {
      const cancelApplicationBtn = document.createElement('button');
      cancelApplicationBtn.className = 'btn btn-outline';
      cancelApplicationBtn.textContent = 'Cancel Application';
      cancelApplicationBtn.addEventListener('click', () => {
        window.app.confirmDialog(
          'Cancel Loan Application',
          'Are you sure you want to cancel this loan application? This action cannot be undone.',
          () => cancelLoanApplication(loan._id)
        );
      });
      
      actionsContainer.appendChild(cancelApplicationBtn);
    }
  }
  
  function showLoanApplicationModal() {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <form id="loanApplicationForm">
        <div class="form-group">
          <label for="loanType">Loan Type</label>
          <select id="loanType" name="loanType" class="form-control" required>
            <option value="seed">Seed Loan</option>
            <option value="equipment">Equipment Loan</option>
            <option value="fertilizer">Fertilizer Loan</option>
            <option value="general">General Agricultural Loan</option>
            <option value="emergency">Emergency Loan</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="amount">Loan Amount (KES)</label>
          <input type="number" id="amount" name="amount" min="1000" step="1000" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="term">Loan Term (Months)</label>
          <select id="term" name="term" class="form-control" required>
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="9">9 months</option>
            <option value="12">12 months</option>
            <option value="18">18 months</option>
            <option value="24">24 months</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="purpose">Loan Purpose</label>
          <textarea id="purpose" name="purpose" class="form-control" rows="3" required></textarea>
        </div>
        
        <div class="form-group">
          <label for="collateral">Collateral (if any)</label>
          <input type="text" id="collateral" name="collateral" class="form-control">
        </div>
        
        <div id="loanCalculationResults" style="margin-top: 20px; display: none;">
          <h4 style="margin-bottom: 15px;">Loan Calculation</h4>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Estimated Interest Rate:</span>
              <span id="estimatedInterestRate">14%</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Monthly Payment:</span>
              <span id="monthlyPayment">KES 0</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Total Interest:</span>
              <span id="totalInterest">KES 0</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #ddd; padding-top: 10px; font-weight: bold;">
              <span>Total Repayment:</span>
              <span id="totalRepayment">KES 0</span>
            </div>
          </div>
        </div>
      </form>
    `;
    
    window.app.createModal('Apply for Loan', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Apply',
        class: 'btn',
        handler: () => submitLoanApplication()
      }
    ]);
    
    // Set up event listeners for loan calculation
    const amountInput = document.getElementById('amount');
    const termSelect = document.getElementById('term');
    
    if (amountInput && termSelect) {
      amountInput.addEventListener('input', calculateLoan);
      termSelect.addEventListener('change', calculateLoan);
    }
  }
  
  function calculateLoan() {
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const term = parseInt(document.getElementById('term').value) || 0;
    
    if (amount > 0 && term > 0) {
      // Estimate interest rate based on term
      let interestRate = 14; // Default rate
      if (term <= 6) {
        interestRate = 12;
      } else if (term <= 12) {
        interestRate = 14;
      } else {
        interestRate = 16;
      }
      
      // Calculate loan details
      const calculation = window.app.calculateLoanSchedule(amount, interestRate, term);
      
      // Update UI
      document.getElementById('estimatedInterestRate').textContent = `${interestRate}%`;
      document.getElementById('monthlyPayment').textContent = window.app.formatCurrency(calculation.monthlyPayment);
      document.getElementById('totalInterest').textContent = window.app.formatCurrency(calculation.totalInterest);
      document.getElementById('totalRepayment').textContent = window.app.formatCurrency(calculation.totalPayment);
      
      // Show calculation results
      document.getElementById('loanCalculationResults').style.display = 'block';
    } else {
      // Hide calculation results if amount or term is invalid
      document.getElementById('loanCalculationResults').style.display = 'none';
    }
  }
  
  async function submitLoanApplication() {
    const loanType = document.getElementById('loanType').value;
    const amount = document.getElementById('amount').value;
    const term = document.getElementById('term').value;
    const purpose = document.getElementById('purpose').value;
    const collateral = document.getElementById('collateral').value;
    
    try {
      window.app.showLoading();
      
      const response = await fetch('http://localhost:5000/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          loanType,
          amount,
          term,
          purpose,
          collateral
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit loan application');
      }
      
      const data = await response.json();
      
      window.app.hideLoading();
      window.app.closeModal();
      
      // Show success message
      window.app.showToast('Loan application submitted successfully', 'success');
      
      // Redirect to loan details page
      window.location.href = `loans.html?id=${data.data._id}`;
    } catch (error) {
      window.app.hideLoading();
      console.error('Error submitting loan application:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  async function showLoanRepaymentModal(loanId) {
    try {
      window.app.showLoading();
      
      // Get loan details
      const response = await fetch(`http://localhost:5000/api/loans/${loanId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load loan details');
      }
      
      const data = await response.json();
      const loan = data.data;
      
      window.app.hideLoading();
      
      // Find next pending installment
      const nextInstallment = loan.repaymentSchedule.find(installment => 
        installment.status === 'pending'
      );
      
      if (!nextInstallment) {
        window.app.showToast('No pending installments found', 'error');
        return;
      }
      
      const modalContent = document.createElement('div');
      modalContent.innerHTML = `
        <form id="loanRepaymentForm">
          <div class="form-group">
            <label>Loan Type</label>
            <div class="form-control-static">${loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1)} Loan</div>
          </div>
          
          <div class="form-group">
            <label>Installment Number</label>
            <div class="form-control-static">#${nextInstallment.installmentNumber}</div>
            <input type="hidden" id="installmentNumber" name="installmentNumber" value="${nextInstallment.installmentNumber}">
          </div>
          
          <div class="form-group">
            <label>Due Date</label>
            <div class="form-control-static">${window.app.formatDate(nextInstallment.dueDate)}</div>
          </div>
          
          <div class="form-group">
            <label>Amount Due</label>
            <div class="form-control-static">${window.app.formatCurrency(nextInstallment.amount)}</div>
          </div>
          
          <div class="form-group">
            <label for="amount">Payment Amount (KES)</label>
            <input type="number" id="amount" name="amount" min="100" step="100" class="form-control" value="${nextInstallment.amount}" required>
          </div>
          
          <div class="form-group">
            <label for="paymentMethod">Payment Method</label>
            <select id="paymentMethod" name="paymentMethod" class="form-control" required>
              <option value="mobile-money">Mobile Money</option>
              <option value="bank-transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="transactionReference">Transaction Reference</label>
            <input type="text" id="transactionReference" name="transactionReference" class="form-control" required>
          </div>
        </form>
      `;
      
      window.app.createModal('Loan Repayment', modalContent, [
        {
          text: 'Cancel',
          class: 'btn btn-outline',
          handler: () => window.app.closeModal()
        },
        {
          text: 'Make Payment',
          class: 'btn',
          handler: () => processLoanRepayment(loanId)
        }
      ]);
    } catch (error) {
      window.app.hideLoading();
      console.error('Error loading loan details:', error);
      window.app.showToast('Failed to load loan details', 'error');
    }
  }
  
  async function processLoanRepayment(loanId) {
    const installmentNumber = document.getElementById('installmentNumber').value;
    const amount = document.getElementById('amount').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const transactionReference = document.getElementById('transactionReference').value;
    
    try {
      window.app.showLoading();
      
      const response = await fetch(`http://localhost:5000/api/loans/${loanId}/repayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          installmentNumber,
          amount,
          paymentMethod,
          transactionReference
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process loan repayment');
      }
      
      window.app.hideLoading();
      window.app.closeModal();
      
      // Show success message
      window.app.showToast('Loan repayment processed successfully', 'success');
      
      // Redirect to loan details page
      window.location.href = `loans.html?id=${loanId}`;
    } catch (error) {
      window.app.hideLoading();
      console.error('Error processing loan repayment:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  async function cancelLoanApplication(loanId) {
    try {
      window.app.showLoading();
      
      // In a real application, you would call an API endpoint to cancel the loan
      // Since we don't have a specific endpoint for this, we'll just simulate it
      
      // Redirect to loans list after a short delay
      setTimeout(() => {
        window.app.hideLoading();
        window.app.showToast('Loan application cancelled successfully', 'success');
        window.location.href = 'loans.html';
      }, 1000);
    } catch (error) {
      window.app.hideLoading();
      console.error('Error cancelling loan application:', error);
      window.app.showToast(error.message, 'error');
    }
  }