// dashboard.js - Load member details from localStorage

document.addEventListener("DOMContentLoaded", function () {
  // Check if user is logged in
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    // Redirect to login page if no auth token
    window.location.href = "login.html";
    return;
  }

  // Load member data from localStorage
  loadMemberFromLocalStorage();

  // Setup UI interactions
  setupUIInteractions();
});

// Load member data from localStorage and update UI
function loadMemberFromLocalStorage() {
  try {
    // Get data from localStorage
    const storedMemberData = localStorage.getItem("memberData");
    if (storedMemberData) {
      const memberData = JSON.parse(storedMemberData);
      updateUIWithMemberData(memberData);

      // For demo purposes, load simulated financial data
      loadFinancialData(memberData.id);
    } else {
      console.error("No member data found in localStorage");
      // You might want to redirect to login if no data is found
    }
  } catch (error) {
    console.error("Error loading member data from localStorage:", error);
  }
}

// Update UI elements with member data
function updateUIWithMemberData(memberData) {
  // Update user initials
  const initials = getInitials(memberData.firstName, memberData.lastName);

  // Update all places where user info appears
  document.getElementById("userInitials").textContent = initials;
  document.getElementById("sidebarUserInitials").textContent = initials;

  // Update name displays
  document.getElementById(
    "userName"
  ).textContent = `${memberData.firstName} ${memberData.lastName}`;
  document.getElementById(
    "sidebarUserName"
  ).textContent = `${memberData.firstName} ${memberData.lastName}`;
  document.getElementById("welcomeUserName").textContent = memberData.firstName;

  // Update membership ID
  document.getElementById(
    "membershipId"
  ).textContent = `Member ID: ${memberData.id}`;

  // Update share capital
  // This would normally come from the member data, using placeholder for demo
  document.getElementById("shareCapital").textContent = `KES 25,000`;
}

// Load financial data (simulation for demo)
function loadFinancialData(memberId) {
  // In a real app, this would fetch data from an API
  // For demo, we're using placeholder data

  // Load recent transactions
  const transactions = [
    {
      date: "2025-03-27",
      description: "Share Capital Purchase",
      amount: 5000,
      status: "completed",
    },
    {
      date: "2025-03-22",
      description: "Loan Repayment",
      amount: -3000,
      status: "completed",
    },
    {
      date: "2025-03-15",
      description: "Savings Deposit",
      amount: 2000,
      status: "completed",
    },
    {
      date: "2025-03-10",
      description: "Product Sale",
      amount: 7500,
      status: "completed",
    },
  ];

  const transactionsContainer = document.getElementById("recentTransactions");
  if (transactionsContainer) {
    transactionsContainer.innerHTML = transactions
      .map(
        (transaction) => `
        <tr>
          <td>${formatDate(transaction.date)}</td>
          <td>${transaction.description}</td>
          <td class="${
            transaction.amount >= 0 ? "text-success" : "text-danger"
          }">
            ${formatCurrency(Math.abs(transaction.amount))}
          </td>
          <td>
            <span class="status-badge ${transaction.status}">
              ${capitalizeFirstLetter(transaction.status)}
            </span>
          </td>
        </tr>
      `
      )
      .join("");
  }

  // Initialize financial chart
  initializeFinancialChart();
}

// Initialize financial chart with Chart.js
function initializeFinancialChart() {
  const ctx = document.getElementById("financialChart");
  if (!ctx) return;

  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Savings",
          data: [12000, 15000, 20000, 25000, 35000, 45750],
          borderColor: "#28a745",
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          borderWidth: 2,
          fill: true,
        },
        {
          label: "Loans",
          data: [50000, 45000, 40000, 35000, 32000, 30000],
          borderColor: "#dc3545",
          backgroundColor: "rgba(220, 53, 69, 0.1)",
          borderWidth: 2,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "KES " + value.toLocaleString();
            },
          },
        },
      },
    },
  });
}

// Setup UI interactions (dropdowns, etc.)
function setupUIInteractions() {
  // Toggle user dropdown
  const userDropdownToggle = document.getElementById("userDropdownToggle");
  const userDropdownMenu = document.getElementById("userDropdownMenu");

  if (userDropdownToggle && userDropdownMenu) {
    userDropdownToggle.addEventListener("click", function (e) {
      e.preventDefault();
      userDropdownMenu.style.display =
        userDropdownMenu.style.display === "block" ? "none" : "block";
    });
  }

  // Toggle notification dropdown
  const notificationToggle = document.getElementById("notificationToggle");
  const notificationContainer = document.getElementById(
    "notificationContainer"
  );

  if (notificationToggle && notificationContainer) {
    notificationToggle.addEventListener("click", function (e) {
      e.preventDefault();
      notificationContainer.style.display =
        notificationContainer.style.display === "block" ? "none" : "block";
    });
  }

  // Handle logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("authToken");
      localStorage.removeItem("memberData");
      window.location.href = "login.html";
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener("click", function (e) {
    if (userDropdownMenu && userDropdownToggle) {
      if (
        !userDropdownToggle.contains(e.target) &&
        !userDropdownMenu.contains(e.target)
      ) {
        userDropdownMenu.style.display = "none";
      }
    }

    if (notificationContainer && notificationToggle) {
      if (
        !notificationToggle.contains(e.target) &&
        !notificationContainer.contains(e.target)
      ) {
        notificationContainer.style.display = "none";
      }
    }
  });
}

// Helper Functions

// Get initials from first and last name
function getInitials(firstName, lastName) {
  return `${firstName ? firstName[0].toUpperCase() : ""}${
    lastName ? lastName[0].toUpperCase() : ""
  }`;
}

// Format currency
function formatCurrency(amount) {
  return `KES ${amount.toLocaleString()}`;
}

// Format date
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
