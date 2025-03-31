// admin.js - Script to connect admin dashboard UI to backend

// Base URL for API endpoints
const API_BASE_URL = "http://localhost:5000/api/admin";

// Global state to store dashboard data
let dashboardState = {
  stats: {},
  recentActivities: [],
  pendingLoanApplications: [],
};

// DOM Elements
const elementsToUpdate = {
  statsCards: document.querySelector(".stats-cards"),
  activityList: document.querySelector(".activity-list"),
  loanApplicationsTable: document.querySelector(".loan-applications tbody"),
};

// Initialize the dashboard
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the dashboard
  initializeDashboard();

  // Set up event listeners
  setupEventListeners();
});

// Main initialization function
async function initializeDashboard() {
  try {
    // Show loading indicators
    showLoadingState();

    // Fetch all required data concurrently
    await Promise.all([
      fetchDashboardStats(),
      fetchRecentActivity(),
      fetchPendingLoanApplications(),
    ]);

    // Update UI with fetched data
    updateDashboardUI();

    // Set up auto-refresh for real-time data (every 5 minutes)
    setInterval(() => {
      refreshDashboardData();
    }, 5 * 60 * 1000);

    console.log("Dashboard successfully initialized");
  } catch (error) {
    console.error("Error initializing dashboard:", error);
    showErrorMessage(
      "Failed to load dashboard data. Please try refreshing the page."
    );
  }
}

// Fetch dashboard statistics
async function fetchDashboardStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "success") {
      dashboardState.stats = data.data.stats;
      console.log("starts ", dashboardState.stats);
    } else {
      throw new Error("Failed to fetch dashboard stats");
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}

// Fetch recent activity
async function fetchRecentActivity() {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/recent-activity`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "success") {
      dashboardState.recentActivities = data.data.activities;
    } else {
      throw new Error("Failed to fetch recent activities");
    }
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw error;
  }
}

// Fetch pending loan applications
async function fetchPendingLoanApplications() {
  try {
    // This endpoint isn't fully implemented in the backend yet,
    // so we'll use a mock endpoint for now
    const response = await fetch(`${API_BASE_URL}/loans/pending`);

    if (!response.ok) {
      // If endpoint not implemented yet, use mock data
      if (response.status === 404 || response.status === 501) {
        console.warn(
          "Pending loans endpoint not implemented, using placeholder data"
        );
        // We'll keep the existing data in the HTML for now
        return;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "success") {
      dashboardState.pendingLoanApplications = data.data.loans;
    } else {
      throw new Error("Failed to fetch pending loan applications");
    }
  } catch (error) {
    console.error("Error fetching pending loan applications:", error);
    // Don't throw error here, just use placeholder data
  }
}

// Update the UI with fetched data
function updateDashboardUI() {
  // Update stats cards
  updateStatsCards();

  // Update recent activity
  updateRecentActivity();

  // Update pending loan applications if data is available
  if (dashboardState.pendingLoanApplications.length > 0) {
    updatePendingLoanApplications();
  }

  // Remove loading indicators
  hideLoadingState();
}

// This is how the updateStatsCards function should look
function updateStatsCards() {
  const {
    totalMembers,
    memberGrowth,
    totalSavings,
    savingsGrowth,
    activeLoans,
    loanGrowth,
    marketplaceListings,
    marketplaceGrowth,
  } = dashboardState.stats;

  // Update members card
  const totalMembersElement = document.getElementById("total-members");
  const membersGrowthElement = document.getElementById("members-growth");

  if (totalMembersElement && totalMembers !== undefined) {
    totalMembersElement.textContent = formatNumber(totalMembers);
  }

  if (membersGrowthElement && memberGrowth !== undefined) {
    membersGrowthElement.textContent = `${
      memberGrowth >= 0 ? "+" : ""
    }${memberGrowth}%`;
    membersGrowthElement.className =
      memberGrowth >= 0 ? "positive" : "negative";
  }

  // Update savings card
  const totalSavingsElement = document.getElementById("total-savings");
  const savingsGrowthElement = document.getElementById("savings-growth");

  if (totalSavingsElement && totalSavings !== undefined) {
    totalSavingsElement.textContent = formatCurrency(totalSavings);
  }

  if (savingsGrowthElement && savingsGrowth !== undefined) {
    savingsGrowthElement.textContent = `${
      savingsGrowth >= 0 ? "+" : ""
    }${savingsGrowth}%`;
    savingsGrowthElement.className =
      savingsGrowth >= 0 ? "positive" : "negative";
  }

  // Update loans card
  const activeLoansElement = document.getElementById("active-loans");
  const loansGrowthElement = document.getElementById("loans-growth");

  if (activeLoansElement && activeLoans !== undefined) {
    activeLoansElement.textContent = formatNumber(activeLoans);
  }

  if (loansGrowthElement && loanGrowth !== undefined) {
    loansGrowthElement.textContent = `${
      loanGrowth >= 0 ? "+" : ""
    }${loanGrowth}%`;
    loansGrowthElement.className = loanGrowth >= 0 ? "positive" : "negative";
  }

  // Update marketplace card
  const marketplaceListingsElement = document.getElementById(
    "marketplace-listings"
  );
  const marketplaceGrowthElement =
    document.getElementById("marketplace-growth");

  if (marketplaceListingsElement && marketplaceListings !== undefined) {
    marketplaceListingsElement.textContent = formatNumber(marketplaceListings);
  }

  if (marketplaceGrowthElement && marketplaceGrowth !== undefined) {
    marketplaceGrowthElement.textContent = `${
      marketplaceGrowth >= 0 ? "+" : ""
    }${marketplaceGrowth}%`;
    marketplaceGrowthElement.className =
      marketplaceGrowth >= 0 ? "positive" : "negative";
  }
}

// Update recent activity list
function updateRecentActivity() {
  const activityList = document.querySelector(".activity-list");
  if (!activityList || !dashboardState.recentActivities.length) return;

  // Clear current content
  activityList.innerHTML = "";

  // Add each activity item
  dashboardState.recentActivities.forEach((activity) => {
    const activityItem = createActivityItem(activity);
    activityList.appendChild(activityItem);
  });
}

// Create activity item element
function createActivityItem(activity) {
  // Create activity item container
  const item = document.createElement("div");
  item.className = "activity-item";

  // Determine icon based on activity type
  let iconClass = "fas fa-bell";

  switch (activity.type) {
    case "member_registration":
      iconClass = "fas fa-user-plus";
      break;
    case "loan_application":
      iconClass = "fas fa-comment-dollar";
      break;
    case "marketplace_listing":
      iconClass = "fas fa-seedling";
      break;
    case "loan_approval":
      iconClass = "fas fa-money-bill-wave";
      break;
    case "transaction":
      iconClass = "fas fa-exchange-alt";
      break;
  }

  // Format the time
  const timeString = formatTimeAgo(new Date(activity.timestamp));

  // Create the HTML structure
  item.innerHTML = `
    <div class="activity-icon">
      <i class="${iconClass}"></i>
    </div>
    <div class="activity-details">
      <h4>${getActivityTitle(activity.type)}</h4>
      <p>${activity.details}</p>
      <span class="time">${timeString}</span>
    </div>
    <div class="activity-action">
      <button class="btn-review" data-id="${activity.id}" data-type="${
    activity.type
  }">Review</button>
    </div>
  `;

  // Add event listener for the review button
  const reviewButton = item.querySelector(".btn-review");
  if (reviewButton) {
    reviewButton.addEventListener("click", () =>
      handleActivityAction(activity)
    );
  }

  return item;
}

// Get appropriate title for activity type
function getActivityTitle(type) {
  switch (type) {
    case "member_registration":
      return "New Member Registration";
    case "loan_application":
      return "Loan Application";
    case "marketplace_listing":
      return "New Marketplace Listing";
    case "loan_approval":
      return "Loan Approval";
    case "transaction":
      return "New Transaction";
    default:
      return "Activity";
  }
}

// Update pending loan applications table
function updatePendingLoanApplications() {
  const tbody = document.querySelector(".loan-applications tbody");
  if (!tbody || !dashboardState.pendingLoanApplications.length) return;

  // Clear current content
  tbody.innerHTML = "";

  // Add each loan application row
  dashboardState.pendingLoanApplications.forEach((loan) => {
    const row = createLoanApplicationRow(loan);
    tbody.appendChild(row);
  });
}

// Create loan application table row
function createLoanApplicationRow(loan) {
  const row = document.createElement("tr");

  // Format the date
  const applicationDate = new Date(loan.applicationDate);
  const formattedDate = applicationDate.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Create status element with appropriate class
  let statusClass = "pending";
  if (loan.status === "under_review") statusClass = "review";
  if (loan.status === "approved") statusClass = "approved";
  if (loan.status === "rejected") statusClass = "rejected";

  // Create action buttons based on status
  let actionButtons = "";
  if (loan.status === "pending") {
    actionButtons = `
      <button class="btn-action approve" data-id="${loan.id}">Approve</button>
      <button class="btn-action reject" data-id="${loan.id}">Reject</button>
    `;
  } else {
    actionButtons = `
      <button class="btn-action details" data-id="${loan.id}">Details</button>
    `;
  }

  // Create the row content
  row.innerHTML = `
    <td>${loan.memberId}</td>
    <td>${loan.memberName}</td>
    <td>${loan.loanType}</td>
    <td>${formatCurrency(loan.amount)}</td>
    <td>${loan.purpose}</td>
    <td>${formattedDate}</td>
    <td><span class="status ${statusClass}">${formatStatus(
    loan.status
  )}</span></td>
    <td>${actionButtons}</td>
  `;

  // Add event listeners for action buttons
  const approveBtn = row.querySelector(".approve");
  const rejectBtn = row.querySelector(".reject");
  const detailsBtn = row.querySelector(".details");

  if (approveBtn) {
    approveBtn.addEventListener("click", () =>
      handleLoanApproval(loan.id, "approve")
    );
  }

  if (rejectBtn) {
    rejectBtn.addEventListener("click", () =>
      handleLoanApproval(loan.id, "reject")
    );
  }

  if (detailsBtn) {
    detailsBtn.addEventListener("click", () => viewLoanDetails(loan.id));
  }

  return row;
}

// Format status text for display
function formatStatus(status) {
  switch (status) {
    case "pending":
      return "Pending";
    case "under_review":
      return "Under Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
  }
}

// Handle loan approval or rejection
async function handleLoanApproval(loanId, action) {
  try {
    const confirmed = confirm(
      `Are you sure you want to ${action} this loan application?`
    );
    if (!confirmed) return;

    const response = await fetch(`${API_BASE_URL}/loans/${loanId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: action === "approve" ? "approved" : "rejected",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "success") {
      showSuccessMessage(`Loan application ${action}d successfully!`);
      // Refresh loan applications data
      await fetchPendingLoanApplications();
      updatePendingLoanApplications();
    } else {
      throw new Error(`Failed to ${action} loan application`);
    }
  } catch (error) {
    console.error(`Error ${action}ing loan application:`, error);
    showErrorMessage(`Failed to ${action} loan application. Please try again.`);
  }
}

// View loan details
function viewLoanDetails(loanId) {
  // This would typically open a modal with loan details
  // For now, we'll just redirect to a details page
  window.location.href = `loans/details.html?id=${loanId}`;
}

// Handle activity action (review button)
function handleActivityAction(activity) {
  // This would typically open a modal or redirect to a details page
  // For now, we'll just log and alert
  console.log("Activity action:", activity);
  alert(`Viewing details for activity: ${activity.details}`);
}

// Setup all event listeners
function setupEventListeners() {
  // Add event listener for sidebar navigation
  const sideNavLinks = document.querySelectorAll(".side-nav a");
  sideNavLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetSection = link.getAttribute("href").substring(1);

      // Remove active class from all links
      sideNavLinks.forEach((link) => {
        link.parentElement.classList.remove("active");
      });

      // Add active class to clicked link
      link.parentElement.classList.add("active");

      // Handle navigation (in a full implementation, this would load different views)
      console.log(`Navigating to ${targetSection}`);

      // For demo purposes, we'll show an alert for unimplemented sections
      if (targetSection !== "dashboard") {
        alert(
          `${
            targetSection.charAt(0).toUpperCase() + targetSection.slice(1)
          } section not yet implemented in this demo.`
        );
      }
    });
  });

  // Search functionality
  const searchInput = document.querySelector(".search-container input");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
          alert(
            `Search functionality not implemented in this demo. You searched for: ${searchTerm}`
          );
        }
      }
    });
  }

  // Notification bell
  const notificationBell = document.querySelector(".notification-bell");
  if (notificationBell) {
    notificationBell.addEventListener("click", () => {
      alert("Notifications panel not implemented in this demo.");
    });
  }

  // Messages icon
  const messageIcon = document.querySelector(".message-icon");
  if (messageIcon) {
    messageIcon.addEventListener("click", () => {
      alert("Messages panel not implemented in this demo.");
    });
  }

  // "View All" links
  const viewAllLinks = document.querySelectorAll(".view-all-link");
  viewAllLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.closest("section").classList[0];
      alert(`"View All" for ${section} not implemented in this demo.`);
    });
  });
}

// Show loading state in UI
function showLoadingState() {
  // Add loading class to main stats cards
  const statCards = document.querySelectorAll(".stat-card");
  statCards.forEach((card) => {
    card.classList.add("loading");
    // Optional: Change content to loading placeholders
    const valueElement = card.querySelector("h2");
    if (valueElement) {
      valueElement.dataset.originalText = valueElement.textContent;
      valueElement.textContent = "...";
    }
  });

  // Add loading overlay to activity list and loan applications
  const activitySection = document.querySelector(".recent-activity");
  const loansSection = document.querySelector(".loan-applications");

  if (activitySection) {
    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    activitySection.appendChild(loadingOverlay);
  }

  if (loansSection) {
    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    loansSection.appendChild(loadingOverlay);
  }
}

// Hide loading state in UI
function hideLoadingState() {
  // Remove loading class from stats cards
  const statCards = document.querySelectorAll(".stat-card");
  statCards.forEach((card) => {
    card.classList.remove("loading");
    // Restore original text if it was changed
    const valueElement = card.querySelector("h2");
    if (valueElement && valueElement.dataset.originalText) {
      valueElement.textContent = valueElement.dataset.originalText;
      delete valueElement.dataset.originalText;
    }
  });

  // Remove loading overlays
  const loadingOverlays = document.querySelectorAll(".loading-overlay");
  loadingOverlays.forEach((overlay) => {
    overlay.remove();
  });
}

// Refresh dashboard data
async function refreshDashboardData() {
  try {
    await Promise.all([
      fetchDashboardStats(),
      fetchRecentActivity(),
      fetchPendingLoanApplications(),
    ]);

    updateDashboardUI();
    console.log("Dashboard data refreshed");
  } catch (error) {
    console.error("Error refreshing dashboard data:", error);
  }
}

// Helper functions
function formatNumber(number) {
  return number.toLocaleString();
}

function formatCurrency(amount) {
  return `$${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
}

// UI notification functions
function showSuccessMessage(message) {
  // Check if notification container exists, create if not
  let notificationContainer = document.querySelector(".notification-container");

  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.className = "notification-container";
    document.body.appendChild(notificationContainer);
  }

  const notification = document.createElement("div");
  notification.className = "notification success";
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-check-circle"></i>
    </div>
    <div class="notification-content">
      <p>${message}</p>
    </div>
    <button class="notification-close">&times;</button>
  `;

  // Add to container
  notificationContainer.appendChild(notification);

  // Add event listener to close button
  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.addEventListener("click", () => {
    notification.classList.add("closing");
    setTimeout(() => {
      notification.remove();
    }, 300);
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.add("closing");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

function showErrorMessage(message) {
  // Similar to success message but with error styling
  let notificationContainer = document.querySelector(".notification-container");

  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.className = "notification-container";
    document.body.appendChild(notificationContainer);
  }

  const notification = document.createElement("div");
  notification.className = "notification error";
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-exclamation-circle"></i>
    </div>
    <div class="notification-content">
      <p>${message}</p>
    </div>
    <button class="notification-close">&times;</button>
  `;

  // Add to container
  notificationContainer.appendChild(notification);

  // Add event listener to close button
  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.addEventListener("click", () => {
    notification.classList.add("closing");
    setTimeout(() => {
      notification.remove();
    }, 300);
  });

  // Auto-remove after 7 seconds
  setTimeout(() => {
    notification.classList.add("closing");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 7000);
}
