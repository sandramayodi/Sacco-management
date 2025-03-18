// frontend/assets/js/savings.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      window.location.href = 'login.html';
      return;
    }
  
    // Check for URL parameters to determine which action to take
    const urlParams = window.app.getUrlParams();
    if (urlParams.action === 'deposit') {
      showDepositModal();
    } else if (urlParams.action === 'goal') {
      showCreateGoalModal();
    }
  
    // Load savings data
    loadSavingsSummary();
    loadSavingsHistory();
  
    // Set up event listeners
    setupEventListeners();
  });
  
  function setupEventListeners() {
    // Deposit button
    const depositBtn = document.getElementById('depositBtn');
    if (depositBtn) {
      depositBtn.addEventListener('click', () => {
        showDepositModal();
      });
    }
    
    // Create goal button
    const createGoalBtn = document.getElementById('createGoalBtn');
    if (createGoalBtn) {
      createGoalBtn.addEventListener('click', () => {
        showCreateGoalModal();
      });
    }
    
    // Mobile money button
    const mobileMoneyBtn = document.getElementById('mobileMoneyBtn');
    if (mobileMoneyBtn) {
      mobileMoneyBtn.addEventListener('click', () => {
        showMobileMoneyModal();
      });
    }
  }
  
  async function loadSavingsSummary() {
    try {
      window.app.showLoading();
      
      const response = await fetch('http://localhost:5000/api/savings/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load savings summary');
      }
      
      const data = await response.json();
      const summary = data.data;
      
      // Update UI with savings summary
      updateSavingsSummaryUI(summary);
      
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading savings summary:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load savings summary', 'error');
    }
  }
  
  function updateSavingsSummaryUI(summary) {
    // Update total savings
    const totalSavingsElement = document.getElementById('totalSavings');
    if (totalSavingsElement) {
      totalSavingsElement.textContent = window.app.formatCurrency(summary.totalSavings);
    }
    
    // Update regular savings
    const regularSavingsElement = document.getElementById('regularSavings');
    if (regularSavingsElement) {
      regularSavingsElement.textContent = window.app.formatCurrency(summary.regularSavings);
    }
    
    // Update goals container
    const goalsContainer = document.getElementById('savingsGoals');
    if (goalsContainer && summary.goalBasedSavings) {
      goalsContainer.innerHTML = '';
      
      if (summary.goalBasedSavings.length === 0) {
        goalsContainer.innerHTML = `
          <div style="text-align: center; padding: 30px;">
            <div style="font-size: 3rem; color: var(--text-light); margin-bottom: 10px;">
              <i class="fas fa-piggy-bank"></i>
            </div>
            <p>You don't have any savings goals yet.</p>
            <button id="createFirstGoalBtn" class="btn">Create Your First Goal</button>
          </div>
        `;
        
        // Add event listener to the create first goal button
        const createFirstGoalBtn = document.getElementById('createFirstGoalBtn');
        if (createFirstGoalBtn) {
          createFirstGoalBtn.addEventListener('click', () => {
            showCreateGoalModal();
          });
        }
      } else {
        summary.goalBasedSavings.forEach(goal => {
          const deadline = new Date(goal.deadline);
          const today = new Date();
          const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
          
          const goalCard = document.createElement('div');
          goalCard.className = 'savings-goal-card';
          goalCard.innerHTML = `
            <div class="savings-goal-header">
              <div class="savings-goal-title">${goal.goalName}</div>
              <div class="savings-goal-amount">${window.app.formatCurrency(goal.currentAmount)} / ${window.app.formatCurrency(goal.targetAmount)}</div>
            </div>
            <div class="savings-goal-progress">
              <div class="progress-container">
                <div class="progress-bar" style="width: ${goal.progress}%;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-top: 5px;">
                <span>${goal.progress.toFixed(0)}% Complete</span>
                <span>${daysLeft > 0 ? `${daysLeft} days left` : 'Past deadline'}</span>
              </div>
            </div>
            <div class="savings-goal-dates">
              <div>Started: ${new Date(goal.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              <div>Target: ${deadline.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            </div>
            <div class="savings-goal-footer">
              <button class="btn btn-small" onclick="depositToGoal('${goal.goalName}')">Add Deposit</button>
            </div>
          `;
          
          goalsContainer.appendChild(goalCard);
        });
      }
    }
  }
  
  async function loadSavingsHistory() {
    try {
      const response = await fetch('http://localhost:5000/api/savings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load savings history');
      }
      
      const data = await response.json();
      const savings = data.data;
      
      // Update UI with savings history
      updateSavingsHistoryUI(savings);
    } catch (error) {
      console.error('Error loading savings history:', error);
      window.app.showToast('Failed to load savings history', 'error');
    }
  }
  
  function updateSavingsHistoryUI(savings) {
    const savingsHistoryContainer = document.getElementById('savingsHistory');
    if (!savingsHistoryContainer) return;
    
    // Clear container
    savingsHistoryContainer.innerHTML = '';
    
    if (savings.length === 0) {
      savingsHistoryContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-light);">
          No savings transactions found
        </div>
      `;
      return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.className = 'table';
    
    // Add table header
    table.innerHTML = `
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Amount</th>
          <th>Payment Method</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody id="savingsTableBody"></tbody>
    `;
    
    savingsHistoryContainer.appendChild(table);
    
    const tableBody = document.getElementById('savingsTableBody');
    
    // Add savings to table
    savings.forEach(saving => {
      const row = document.createElement('tr');
      
      const date = new Date(saving.transactionDate);
      const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      
      let savingType = 'Regular Savings';
      if (saving.savingType === 'goal-based') {
        savingType = `Goal: ${saving.goalName}`;
      }
      
      let statusClass = 'transaction-status';
      if (saving.status === 'completed') {
        statusClass += ' completed';
      } else if (saving.status === 'pending') {
        statusClass += ' pending';
      } else if (saving.status === 'failed') {
        statusClass += ' failed';
      }
      
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${savingType}</td>
        <td>${window.app.formatCurrency(saving.amount)}</td>
        <td>${window.app.formatTransactionType(saving.paymentMethod)}</td>
        <td><span class="${statusClass}">${saving.status}</span></td>
      `;
      
      tableBody.appendChild(row);
    });
  }
  
  function showDepositModal() {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <form id="depositForm">
        <div class="form-group">
          <label for="savingType">Saving Type</label>
          <select id="savingType" name="savingType" class="form-control" required>
            <option value="regular">Regular Savings</option>
            <option value="goal-based">Goal-Based Savings</option>
          </select>
        </div>
        
        <div id="goalNameContainer" class="form-group" style="display: none;">
          <label for="goalName">Select Goal</label>
          <select id="goalName" name="goalName" class="form-control"></select>
        </div>
        
        <div class="form-group">
          <label for="amount">Amount (KES)</label>
          <input type="number" id="amount" name="amount" min="100" step="100" class="form-control" required>
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
    
    window.app.createModal('Deposit Savings', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Deposit',
        class: 'btn',
        handler: () => depositSavings()
      }
    ]);
    
    // Load goals for dropdown
    loadGoalsForDropdown();
    
    // Add event listener for saving type change
    document.getElementById('savingType').addEventListener('change', function() {
      const goalNameContainer = document.getElementById('goalNameContainer');
      if (this.value === 'goal-based') {
        goalNameContainer.style.display = 'block';
      } else {
        goalNameContainer.style.display = 'none';
      }
    });
  }
  
  async function loadGoalsForDropdown() {
    try {
      const response = await fetch('http://localhost:5000/api/savings/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load goals');
      }
      
      const data = await response.json();
      const goals = data.data.goalBasedSavings || [];
      
      const goalNameSelect = document.getElementById('goalName');
      if (!goalNameSelect) return;
      
      goalNameSelect.innerHTML = '';
      
      if (goals.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No goals available';
        option.disabled = true;
        option.selected = true;
        goalNameSelect.appendChild(option);
      } else {
        goals.forEach(goal => {
          const option = document.createElement('option');
          option.value = goal.goalName;
          option.textContent = goal.goalName;
          goalNameSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  }
  
  async function depositSavings() {
    const savingType = document.getElementById('savingType').value;
    const amount = document.getElementById('amount').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const transactionReference = document.getElementById('transactionReference').value;
    
    // Get goal details if goal-based
    let goalName, goalAmount, goalDeadline;
    if (savingType === 'goal-based') {
      goalName = document.getElementById('goalName').value;
      
      // Get goal details
      try {
        const response = await fetch('http://localhost:5000/api/savings/summary', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load goal details');
        }
        
        const data = await response.json();
        const goals = data.data.goalBasedSavings || [];
        
        const goal = goals.find(g => g.goalName === goalName);
        if (goal) {
          goalAmount = goal.targetAmount;
          goalDeadline = goal.deadline;
        }
      } catch (error) {
        console.error('Error loading goal details:', error);
      }
    }
    
    const savingData = {
      savingType,
      amount,
      paymentMethod,
      transactionReference
    };
    
    if (savingType === 'goal-based') {
      savingData.goalName = goalName;
      if (goalAmount) savingData.goalAmount = goalAmount;
      if (goalDeadline) savingData.goalDeadline = goalDeadline;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/savings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(savingData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process deposit');
      }
      
      window.app.closeModal();
      window.app.showToast('Deposit processed successfully', 'success');
      
      // Reload savings data
      loadSavingsSummary();
      loadSavingsHistory();
    } catch (error) {
      console.error('Error processing deposit:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  function depositToGoal(goalName) {
    showDepositModal();
    
    // Set form to goal-based saving and select the goal
    setTimeout(() => {
      const savingTypeSelect = document.getElementById('savingType');
      if (savingTypeSelect) {
        savingTypeSelect.value = 'goal-based';
        savingTypeSelect.dispatchEvent(new Event('change'));
        
        setTimeout(() => {
          const goalNameSelect = document.getElementById('goalName');
          if (goalNameSelect) {
            goalNameSelect.value = goalName;
          }
        }, 100);
      }
    }, 100);
  }
  
  function showCreateGoalModal() {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <form id="createGoalForm">
        <div class="form-group">
          <label for="goalName">Goal Name</label>
          <input type="text" id="goalName" name="goalName" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="goalAmount">Target Amount (KES)</label>
          <input type="number" id="goalAmount" name="goalAmount" min="1000" step="1000" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="goalDeadline">Target Date</label>
          <input type="date" id="goalDeadline" name="goalDeadline" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="initialDeposit">Initial Deposit (KES)</label>
          <input type="number" id="initialDeposit" name="initialDeposit" min="100" step="100" class="form-control" required>
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
    
    window.app.createModal('Create Savings Goal', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Create Goal',
        class: 'btn',
        handler: () => createSavingsGoal()
      }
    ]);
    
    // Set minimum date for goal deadline to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('goalDeadline').min = tomorrow.toISOString().split('T')[0];
  }
  
  async function createSavingsGoal() {
    const goalName = document.getElementById('goalName').value;
    const goalAmount = document.getElementById('goalAmount').value;
    const goalDeadline = document.getElementById('goalDeadline').value;
    const initialDeposit = document.getElementById('initialDeposit').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const transactionReference = document.getElementById('transactionReference').value;
    
    try {
      const response = await fetch('http://localhost:5000/api/savings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          savingType: 'goal-based',
          amount: initialDeposit,
          goalName,
          goalAmount,
          goalDeadline,
          paymentMethod,
          transactionReference
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create savings goal');
      }
      
      window.app.closeModal();
      window.app.showToast('Savings goal created successfully', 'success');
      
      // Reload savings data
      loadSavingsSummary();
      loadSavingsHistory();
    } catch (error) {
      console.error('Error creating savings goal:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  function showMobileMoneyModal() {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <form id="mobileMoneyForm">
        <div class="form-group">
          <label for="phoneNumber">Phone Number</label>
          <input type="tel" id="phoneNumber" name="phoneNumber" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="savingType">Saving Type</label>
          <select id="savingType" name="savingType" class="form-control" required>
            <option value="regular">Regular Savings</option>
            <option value="goal-based">Goal-Based Savings</option>
          </select>
        </div>
        
        <div id="goalNameContainer" class="form-group" style="display: none;">
          <label for="goalName">Select Goal</label>
          <select id="goalName" name="goalName" class="form-control"></select>
        </div>
        
        <div class="form-group">
          <label for="amount">Amount (KES)</label>
          <input type="number" id="amount" name="amount" min="100" step="100" class="form-control" required>
        </div>
        
        <div class="alert alert-info">
          <p>You will receive an STK push to your phone to complete the payment.</p>
        </div>
      </form>
    `;
    
    window.app.createModal('Mobile Money Deposit', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Proceed',
        class: 'btn',
        handler: () => processMobileMoneyPayment()
      }
    ]);
    
    // Load goals for dropdown
    loadGoalsForDropdown();
    
    // Add event listener for saving type change
    document.getElementById('savingType').addEventListener('change', function() {
      const goalNameContainer = document.getElementById('goalNameContainer');
      if (this.value === 'goal-based') {
        goalNameContainer.style.display = 'block';
      } else {
        goalNameContainer.style.display = 'none';
      }
    });
    
    // Set default phone number if available
    const memberData = JSON.parse(localStorage.getItem('memberData') || '{}');
    if (memberData.phone) {
      document.getElementById('phoneNumber').value = memberData.phone;
    }
  }
  
  async function processMobileMoneyPayment() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const savingType = document.getElementById('savingType').value;
    const amount = document.getElementById('amount').value;
    
    // Get goal details if goal-based
    let goalName, goalAmount, goalDeadline;
    if (savingType === 'goal-based') {
      goalName = document.getElementById('goalName').value;
      
      // Get goal details from summary
      try {
        const response = await fetch('http://localhost:5000/api/savings/summary', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load goal details');
        }
        
        const data = await response.json();
        const goals = data.data.goalBasedSavings || [];
        
        const goal = goals.find(g => g.goalName === goalName);
        if (goal) {
          goalAmount = goal.targetAmount;
          goalDeadline = goal.deadline;
        }
      } catch (error) {
        console.error('Error loading goal details:', error);
      }
    }
    
    try {
      window.app.showLoading();
      
      const response = await fetch('http://localhost:5000/api/savings/mobile-money', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          phoneNumber,
          amount,
          savingType,
          goalName,
          goalAmount,
          goalDeadline
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process mobile money payment');
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
      
      window.app.createModal('', successModalContent, [
        {
          text: 'OK',
          class: 'btn',
          handler: () => {
            window.app.closeModal();
            
            // Reload savings data
            loadSavingsSummary();
            loadSavingsHistory();
          }
        }
      ]);
    } catch (error) {
      window.app.hideLoading();
      console.error('Error processing mobile money payment:', error);
      window.app.showToast(error.message, 'error');
    }
  }