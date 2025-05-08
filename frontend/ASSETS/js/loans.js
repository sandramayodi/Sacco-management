// frontend/assets/js/loans.js

// Global app object to store utility functions
window.app = window.app || {};

// Show toast message
window.app.showToast = function (message, type = "info") {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      ${type === "success" ? '<i class="fas fa-check-circle"></i>' : ""}
      ${type === "error" ? '<i class="fas fa-exclamation-circle"></i>' : ""}
      ${type === "info" ? '<i class="fas fa-info-circle"></i>' : ""}
      <span>${message}</span>
    </div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
  `;

  // Add toast to container
  toastContainer.appendChild(toast);

  // Add close functionality
  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.classList.add("toast-closing");
    setTimeout(() => {
      toast.remove();
    }, 300);
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add("toast-closing");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, 5000);
};

// Create modal function
window.app.createModal = function (title, content, buttons = []) {
  // Create modal overlay
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  // Create modal container
  const modal = document.createElement("div");
  modal.className = "modal";

  // Create modal header
  const header = document.createElement("div");
  header.className = "modal-header";
  header.innerHTML = `
    <h3>${title}</h3>
    <button class="modal-close"><i class="fas fa-times"></i></button>
  `;

  // Create modal body
  const body = document.createElement("div");
  body.className = "modal-body";
  if (typeof content === "string") {
    body.innerHTML = content;
  } else {
    body.appendChild(content);
  }

  // Create modal footer with buttons
  const footer = document.createElement("div");
  footer.className = "modal-footer";

  buttons.forEach((button) => {
    const btn = document.createElement("button");
    btn.className = button.class || "btn";
    btn.innerHTML = button.text;
    btn.addEventListener("click", button.handler);
    footer.appendChild(btn);
  });

  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  overlay.appendChild(modal);

  // Add close functionality
  header.querySelector(".modal-close").addEventListener("click", () => {
    window.app.closeModal(overlay);
  });

  // Add close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      window.app.closeModal(overlay);
    }
  });

  // Add modal to document
  document.body.appendChild(overlay);

  // Return the modal for reference
  return overlay;
};

// Close modal function
window.app.closeModal = function (modal) {
  if (!modal) {
    modal = document.querySelector(".modal-overlay");
  }

  if (modal) {
    modal.classList.add("closing");
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
};

// Show loading
window.app.showLoading = function () {
  const loadingOverlay = document.createElement("div");
  loadingOverlay.className = "loading-overlay";
  loadingOverlay.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading...</p>
    </div>
  `;
  document.body.appendChild(loadingOverlay);
};

// Hide loading
window.app.hideLoading = function () {
  const loadingOverlay = document.querySelector(".loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
};

document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    window.location.href = "login.html";
    return;
  }

  // Initialize UI elements
  initUI();

  // Load loans
  loadLoans();

  // Set up event listeners
  setupEventListeners();
});

// Initialize UI elements
function initUI() {
  // Set up tabs
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all tab buttons
      tabButtons.forEach((btn) => btn.classList.remove("active"));

      // Add active class to clicked button
      button.classList.add("active");

      // Hide all tab contents
      tabContents.forEach((content) => (content.style.display = "none"));

      // Show selected tab content
      const tabId = button.getAttribute("data-tab");
      document.getElementById(tabId).style.display = "block";
    });
  });

  // Setup dropdown functionality
  const dropdownToggle = document.querySelector(".dropdown-toggle");
  if (dropdownToggle) {
    dropdownToggle.addEventListener("click", function () {
      this.nextElementSibling.classList.toggle("show");
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener("click", function (event) {
    if (!event.target.matches(".dropdown-toggle")) {
      const dropdowns = document.querySelectorAll(".dropdown-menu");
      dropdowns.forEach((dropdown) => {
        if (dropdown.classList.contains("show")) {
          dropdown.classList.remove("show");
        }
      });
    }
  });

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("authToken");
      localStorage.removeItem("memberData");
      window.location.href = "login.html";
    });
  }

  // Setup payment method toggles
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "paymentMethod") {
      togglePaymentSections(e.target.value);
    }
  });
}

// Setup event listeners
function setupEventListeners() {
  // Apply loan button
  const applyLoanBtn = document.getElementById("applyLoanBtn");
  if (applyLoanBtn) {
    applyLoanBtn.addEventListener("click", () => {
      // Switch to apply tab
      document.querySelector('.tab-btn[data-tab="apply"]').click();
    });
  }

  // Loan application form
  const loanApplicationForm = document.getElementById("loanApplicationForm");
  if (loanApplicationForm) {
    loanApplicationForm.addEventListener("submit", submitLoanApplication);
  }

  // Loan type change to show different interest rates
  const loanTypeSelect = document.getElementById("loanType");
  if (loanTypeSelect) {
    loanTypeSelect.addEventListener("change", function () {
      updateInterestRateInfo(this.value);
    });
  }
}

// Load member's loans
async function loadLoans() {
  try {
    const loansContainer = document.getElementById("loansContainer");

    // Show loading state
    loansContainer.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i> Loading loans...
      </div>
    `;

    const response = await fetch("http://localhost:5000/api/loans", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load loans");
    }

    const data = await response.json();
    const loans = data.data;

    if (loans.length === 0) {
      loansContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-info-circle"></i>
          <p>You don't have any loans yet. Apply for a loan to get started.</p>
          <button class="btn" onclick="document.querySelector('.tab-btn[data-tab=\\'apply\\']').click()">
            Apply for Loan
          </button>
        </div>
      `;
      return;
    }

    // Clear loading state
    loansContainer.innerHTML = "";

    // Sort loans by application date (newest first)
    loans.sort(
      (a, b) => new Date(b.applicationDate) - new Date(a.applicationDate)
    );

    // Create loan cards
    loans.forEach((loan) => {
      const loanCard = createLoanCard(loan);
      loansContainer.appendChild(loanCard);
    });
  } catch (error) {
    console.error("Error loading loans:", error);
    document.getElementById("loansContainer").innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load loans. Please try again later.</p>
        <button class="btn btn-outline" onclick="loadLoans()">
          Try Again
        </button>
      </div>
    `;
  }
}

// Create a loan card element
function createLoanCard(loan) {
  const loanCard = document.createElement("div");
  loanCard.className = "loan-card";

  // Format dates
  const applicationDate = new Date(loan.applicationDate).toLocaleDateString();
  const approvalDate = loan.approvalDate
    ? new Date(loan.approvalDate).toLocaleDateString()
    : "Pending";
  const disbursementDate = loan.disbursementDate
    ? new Date(loan.disbursementDate).toLocaleDateString()
    : "Pending";

  // Format loan type for display
  const loanTypeDisplay = formatLoanType(loan.loanType);

  // Calculate progress percentage
  const progressPercentage = loan.progressPercentage || 0;

  loanCard.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
      <div>
        <span class="loan-type-badge">${loanTypeDisplay}</span>
        <h3 style="margin: 5px 0;">KES ${loan.amount.toLocaleString()}</h3>
        <p style="margin: 0; color: #666;">${loan.purpose}</p>
      </div>
      <span class="loan-status ${loan.status}">${formatLoanStatus(
    loan.status
  )}</span>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <div>
        <small style="color: #666;">Applied on:</small>
        <p style="margin: 0;">${applicationDate}</p>
      </div>
      <div>
        <small style="color: #666;">Term:</small>
        <p style="margin: 0;">${loan.term} months</p>
      </div>
      <div>
        <small style="color: #666;">Interest Rate:</small>
        <p style="margin: 0;">${loan.interestRate}%</p>
      </div>
    </div>
    
    ${
      loan.status === "repaying" || loan.status === "fully-paid"
        ? `
      <div style="margin-top: 15px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <small>Repayment Progress</small>
          <small>${progressPercentage.toFixed(1)}%</small>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: ${progressPercentage}%;"></div>
        </div>
      </div>
    `
        : ""
    }
    
    <div style="margin-top: 20px; text-align: right;">
      <button class="btn btn-outline view-loan-btn" data-loan-id="${loan._id}">
        View Details
      </button>
      ${
        loan.status === "disbursed" || loan.status === "repaying"
          ? `
        <button class="btn make-payment-btn" data-loan-id="${loan._id}">
          Make Payment
        </button>
      `
          : ""
      }
    </div>
  `;

  // Add event listeners to the buttons
  loanCard.querySelector(".view-loan-btn").addEventListener("click", () => {
    viewLoanDetails(loan._id);
  });

  const paymentBtn = loanCard.querySelector(".make-payment-btn");
  if (paymentBtn) {
    paymentBtn.addEventListener("click", () => {
      viewLoanDetails(loan._id, true);
    });
  }

  return loanCard;
}

// Format loan type for display
function formatLoanType(loanType) {
  switch (loanType) {
    case "seed":
      return "Seed Loan";
    case "equipment":
      return "Equipment Loan";
    case "fertilizer":
      return "Fertilizer Loan";
    case "livestock":
      return "Livestock Loan";
    case "storage":
      return "Storage Loan";
    case "general":
      return "General Loan";
    default:
      return loanType.charAt(0).toUpperCase() + loanType.slice(1);
  }
}

// Format loan status for display
function formatLoanStatus(status) {
  switch (status) {
    case "applied":
      return "Applied";
    case "under-review":
      return "Under Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "disbursed":
      return "Disbursed";
    case "repaying":
      return "Repaying";
    case "fully-paid":
      return "Fully Paid";
    case "defaulted":
      return "Defaulted";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

// View loan details
async function viewLoanDetails(loanId, showPaymentTab = false) {
  try {
    // Show loading state
    window.app.showLoading();

    // Fetch loan details
    const response = await fetch(`http://localhost:5000/api/loans/${loanId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load loan details");
    }

    const data = await response.json();
    const loan = data.data;

    // Get modal template
    const template = document.getElementById("loanDetailsModalTemplate");
    const modalContent = document.importNode(template.content, true);

    // Populate modal with loan details
    modalContent.getElementById("modalLoanType").textContent = formatLoanType(
      loan.loanType
    );
    modalContent.getElementById("modalLoanAmount").textContent =
      loan.amount.toLocaleString();
    modalContent.getElementById("modalLoanStatus").textContent =
      formatLoanStatus(loan.status);
    modalContent.getElementById(
      "modalLoanStatus"
    ).className = `loan-status ${loan.status}`;
    modalContent.getElementById("modalLoanPurpose").textContent = loan.purpose;
    modalContent.getElementById("modalInterestRate").textContent =
      loan.interestRate;
    modalContent.getElementById("modalLoanTerm").textContent = loan.term;
    modalContent.getElementById("modalApplicationDate").textContent = new Date(
      loan.applicationDate
    ).toLocaleDateString();

    // Calculate total amount and remaining balance
    const totalAmount =
      loan.totalAmount ||
      loan.amount * (1 + (loan.interestRate / 100) * (loan.term / 12));
    const totalPaid = loan.totalPaid || 0;
    const remainingBalance = loan.remainingBalance || totalAmount - totalPaid;
    const progressPercentage =
      loan.progressPercentage || (totalPaid / totalAmount) * 100;

    modalContent.getElementById("modalTotalAmount").textContent =
      totalAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    modalContent.getElementById("modalRemainingBalance").textContent =
      remainingBalance.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    modalContent.getElementById(
      "modalProgressBar"
    ).style.width = `${progressPercentage}%`;
    modalContent.getElementById("modalProgressPercentage").textContent =
      progressPercentage.toFixed(1);

    // Only show repayment schedule if loan is approved or further along
    const repaymentSection = modalContent.getElementById("repaymentSection");
    if (loan.status === "applied" || loan.status === "under-review") {
      repaymentSection.style.display = "none";
    } else {
      // Populate repayment schedule
      const tableBody = modalContent.getElementById("installmentsTableBody");
      tableBody.innerHTML = "";

      if (loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
        loan.repaymentSchedule.forEach((installment) => {
          const row = document.createElement("tr");

          const statusClass =
            installment.status === "paid"
              ? "text-success"
              : new Date(installment.dueDate) < new Date()
              ? "text-danger"
              : "";

          row.innerHTML = `
            <td>${installment.installmentNumber}</td>
            <td>${new Date(installment.dueDate).toLocaleDateString()}</td>
            <td>KES ${installment.amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</td>
            <td class="${statusClass}">${
            installment.status.charAt(0).toUpperCase() +
            installment.status.slice(1)
          }</td>
            <td>
              ${
                installment.status !== "paid" &&
                (loan.status === "disbursed" || loan.status === "repaying")
                  ? `
                <button class="btn btn-sm make-payment-btn" data-loan-id="${loan._id}" data-installment="${installment.installmentNumber}" data-amount="${installment.amount}">
                  Pay Now
                </button>
              `
                  : ""
              }
            </td>
          `;

          tableBody.appendChild(row);
        });

        // Add event listeners to payment buttons
        const paymentButtons = tableBody.querySelectorAll(".make-payment-btn");
        paymentButtons.forEach((button) => {
          button.addEventListener("click", () => {
            const loanId = button.getAttribute("data-loan-id");
            const installmentNo = button.getAttribute("data-installment");
            const amount = button.getAttribute("data-amount");
            showPaymentModal(loanId, installmentNo, amount);
          });
        });
      } else {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center">No repayment schedule available</td>
          </tr>
        `;
      }
    }

    // Create modal
    const modal = window.app.createModal(`Loan Details`, modalContent, [
      {
        text: "Close",
        class: "btn btn-outline",
        handler: () => window.app.closeModal(),
      },
    ]);

    // Hide loading state
    window.app.hideLoading();

    // If showPaymentTab is true and there's an unpaid installment, open payment modal
    if (
      showPaymentTab &&
      loan.repaymentSchedule &&
      loan.repaymentSchedule.length > 0
    ) {
      const unpaidInstallment = loan.repaymentSchedule.find(
        (installment) => installment.status !== "paid"
      );
      if (unpaidInstallment) {
        showPaymentModal(
          loan._id,
          unpaidInstallment.installmentNumber,
          unpaidInstallment.amount
        );
      }
    }
  } catch (error) {
    console.error("Error loading loan details:", error);
    window.app.hideLoading();
    window.app.showToast("Failed to load loan details", "error");
  }
}

// Show payment modal
function showPaymentModal(loanId, installmentNo, amount) {
  // Get payment modal template
  const template = document.getElementById("makePaymentModalTemplate");
  const modalContent = document.importNode(template.content, true);

  // Populate modal with payment details
  modalContent.getElementById("paymentInstallmentNumber").textContent =
    installmentNo;
  modalContent.getElementById("paymentAmountDue").textContent = parseFloat(
    amount
  ).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  modalContent.getElementById("paymentLoanId").value = loanId;
  modalContent.getElementById("paymentInstallmentNo").value = installmentNo;

  // Create modal
  const modal = window.app.createModal(`Make Payment`, modalContent, [
    {
      text: "Cancel",
      class: "btn btn-outline",
      handler: () => window.app.closeModal(),
    },
    {
      text: "Proceed to Pay",
      class: "btn",
      handler: () => processPayment(loanId, installmentNo, amount),
    },
  ]);

  // Add event listener to payment method select
  const paymentMethodSelect = modal.querySelector("#paymentMethod");
  paymentMethodSelect.addEventListener("change", () => {
    togglePaymentSections(paymentMethodSelect.value);
  });

  // Initially show mobile money section
  togglePaymentSections("mobile-money");
}

// Toggle payment method sections
function togglePaymentSections(paymentMethod) {
  const mobileMoneySectionContainer = document.getElementById(
    "mobileMoneySectionContainer"
  );
  const bankTransferSectionContainer = document.getElementById(
    "bankTransferSectionContainer"
  );
  const cashSectionContainer = document.getElementById("cashSectionContainer");

  if (
    mobileMoneySectionContainer &&
    bankTransferSectionContainer &&
    cashSectionContainer
  ) {
    // Hide all sections first
    mobileMoneySectionContainer.style.display = "none";
    bankTransferSectionContainer.style.display = "none";
    cashSectionContainer.style.display = "none";

    // Show the selected section
    if (paymentMethod === "mobile-money") {
      mobileMoneySectionContainer.style.display = "block";
    } else if (paymentMethod === "bank-transfer") {
      bankTransferSectionContainer.style.display = "block";
    } else if (paymentMethod === "cash") {
      cashSectionContainer.style.display = "block";
    }
  }
}

// Process payment
async function processPayment(loanId, installmentNo, amount) {
  const paymentMethod = document.getElementById("paymentMethod").value;

  try {
    // Show loading state
    window.app.showLoading();

    let paymentData = {
      installmentNumber: installmentNo,
      amount: amount,
      paymentMethod: paymentMethod,
    };

    let endpoint = `http://localhost:5000/api/loans/${loanId}/repayment`;

    // Add method-specific data
    if (paymentMethod === "mobile-money") {
      const phoneNumber = document.getElementById("phoneNumber").value;

      if (!phoneNumber) {
        throw new Error("Please enter a phone number");
      }

      endpoint = `http://localhost:5000/api/loans/${loanId}/mobile-money`;
      paymentData.phoneNumber = phoneNumber;
    } else if (paymentMethod === "bank-transfer") {
      const transactionReference = document.getElementById(
        "transactionReference"
      ).value;

      if (!transactionReference) {
        throw new Error("Please enter a transaction reference");
      }

      paymentData.transactionReference = transactionReference;
    } else if (paymentMethod === "cash") {
      // For cash payments, we'd typically handle this differently
      // Here we're using a placeholder transaction reference
      paymentData.transactionReference = `CASH-${Date.now()}`;
    }

    // Send payment to API
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to process payment");
    }

    const data = await response.json();

    // Hide loading state
    window.app.hideLoading();

    // Close modal
    window.app.closeModal();

    // Show success message
    window.app.showToast("Payment processed successfully!", "success");

    // Reload loans
    loadLoans();
  } catch (error) {
    console.error("Error processing payment:", error);
    window.app.hideLoading();
    window.app.showToast(error.message, "error");
  }
}

// Submit loan application
async function submitLoanApplication(e) {
  e.preventDefault();

  try {
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    // Get form data
    const formData = {
      loanType: document.getElementById("loanType").value,
      amount: parseFloat(document.getElementById("amount").value),
      term: parseInt(document.getElementById("term").value),
      purpose: document.getElementById("purpose").value,
      // Farm use data
      farmUse: {
        cropType: document
          .getElementById("cropType")
          .value.split(",")
          .map((crop) => crop.trim())
          .filter((crop) => crop !== ""),
        landSize: parseFloat(document.getElementById("landSize").value) || 0,
        location: document.getElementById("location").value,
      },
      // Collateral data
      collateral: {
        description: document.getElementById("collateralDescription").value,
        value:
          parseFloat(document.getElementById("collateralValue").value) || 0,
      },
      // Guarantor data
      guarantors: [
        {
          name: document.getElementById("guarantorName").value,
          relationship: document.getElementById("guarantorRelationship").value,
          contact: document.getElementById("guarantorContact").value,
          nationalId: document.getElementById("guarantorNationalId").value,
        },
      ],
    };

    // Send application to API
    const response = await fetch("http://localhost:5000/api/loans/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(formData),
    });

    // Reset button state
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to submit loan application");
    }

    const data = await response.json();

    // Show success message
    showToast("Loan application submitted successfully!", "success");

    // Reset form
    e.target.reset();

    // Switch to my loans tab and reload loans
    document.querySelector('.tab-btn[data-tab="myloans"]').click();
    loadLoans();
  } catch (error) {
    console.error("Error submitting loan application:", error);
    showToast(error.message, "error");
  }
}

// Update interest rate info based on loan type
function updateInterestRateInfo(loanType) {
  let interestRate;
  switch (loanType) {
    case "seed":
      interestRate = 10;
      break;
    case "equipment":
      interestRate = 12;
      break;
    case "fertilizer":
      interestRate = 8;
      break;
    case "livestock":
      interestRate = 12;
      break;
    case "storage":
      interestRate = 9;
      break;
    case "general":
      interestRate = 14;
      break;
    default:
      interestRate = 12;
  }

  // Display interest rate info
  const amountInput = document.getElementById("amount");
  const termSelect = document.getElementById("term");

  if (amountInput && termSelect) {
    const amount = parseFloat(amountInput.value) || 0;
    const term = parseInt(termSelect.value) || 12;

    // Add or update interest rate info
    let infoElement = document.getElementById("interestRateInfo");
    if (!infoElement) {
      infoElement = document.createElement("div");
      infoElement.id = "interestRateInfo";
      infoElement.className = "info-box";
      termSelect.parentNode.appendChild(infoElement);
    }

    if (amount > 0 && term > 0) {
      const monthlyInterestRate = interestRate / 100 / 12;
      const monthlyPayment =
        (amount *
          monthlyInterestRate *
          Math.pow(1 + monthlyInterestRate, term)) /
        (Math.pow(1 + monthlyInterestRate, term) - 1);
      const totalAmount = monthlyPayment * term;
      const totalInterest = totalAmount - amount;

      infoElement.innerHTML = `
        <p><strong>Interest Rate:</strong> ${interestRate}%</p>
        <p><strong>Monthly Payment:</strong> KES ${monthlyPayment.toFixed(
          2
        )}</p>
        <p><strong>Total Interest:</strong> KES ${totalInterest.toFixed(2)}</p>
        <p><strong>Total Amount Payable:</strong> KES ${totalAmount.toFixed(
          2
        )}</p>
      `;
      infoElement.style.display = "block";
    } else {
      infoElement.style.display = "none";
    }
  }
}
