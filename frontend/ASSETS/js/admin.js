// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar navigation toggle for mobile view
    const toggleSidebar = () => {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (window.innerWidth <= 992) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        }
    }
    
    // Notifications dropdown functionality
    const notificationBell = document.querySelector('.notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', function(e) {
            // Here you would toggle a notification dropdown
            console.log('Notifications clicked');
            // For demonstration purposes only
            alert('You have 5 new notifications');
        });
    }
    
    // Messages dropdown functionality
    const messageIcon = document.querySelector('.message-icon');
    if (messageIcon) {
        messageIcon.addEventListener('click', function(e) {
            // Here you would toggle a messages dropdown
            console.log('Messages clicked');
            // For demonstration purposes only
            alert('You have 3 unread messages');
        });
    }
    
    // Handle loan approval buttons
    const approveButtons = document.querySelectorAll('.btn-action.approve');
    approveButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const row = this.closest('tr');
            const memberId = row.cells[0].textContent;
            const memberName = row.cells[1].textContent;
            
            // Here you would make an API call to approve the loan
            console.log(`Approving loan for ${memberName} (${memberId})`);
            
            // Update the UI to reflect the change
            const statusCell = row.querySelector('.status');
            statusCell.textContent = 'Approved';
            statusCell.classList.remove('pending');
            statusCell.classList.add('approved');
            
            // Replace the action buttons with a details button
            const actionCell = row.cells[row.cells.length - 1];
            actionCell.innerHTML = '<button class="btn-action details">Details</button>';
            
            // Show success message
            alert(`Loan for ${memberName} has been approved successfully!`);
        });
    });
    
    // Handle loan rejection buttons
    const rejectButtons = document.querySelectorAll('.btn-action.reject');
    rejectButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const row = this.closest('tr');
            const memberId = row.cells[0].textContent;
            const memberName = row.cells[1].textContent;
            
            // Confirm before rejecting
            if (confirm(`Are you sure you want to reject the loan application for ${memberName}?`)) {
                // Here you would make an API call to reject the loan
                console.log(`Rejecting loan for ${memberName} (${memberId})`);
                
                // Update the UI to reflect the change
                const statusCell = row.querySelector('.status');
                statusCell.textContent = 'Rejected';
                statusCell.classList.remove('pending');
                statusCell.classList.add('rejected');
                
                // Replace the action buttons with a details button
                const actionCell = row.cells[row.cells.length - 1];
                actionCell.innerHTML = '<button class="btn-action details">Details</button>';
            }
        });
    });
    
    // Handle details buttons
    const detailButtons = document.querySelectorAll('.btn-action.details');
    detailButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const row = this.closest('tr');
            const memberId = row.cells[0].textContent;
            const memberName = row.cells[1].textContent;
            
            // Here you would navigate to a details page or show a modal
            console.log(`Viewing details for ${memberName} (${memberId})`);
            // For demonstration purposes only
            alert(`Viewing loan details for ${memberName}`);
        });
    });

    // Connect to backend API for data
    const fetchDashboardData = async () => {
        try {
            // Replace with your actual API endpoint
            const response = await fetch('/api/admin/dashboard');
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }
            const data = await response.json();
            
            // Update stats cards with real data
            updateStatsCards(data.stats);
            
            // Update recent activity list
            updateRecentActivity(data.recentActivity);
            
            // Update pending loans table
            updatePendingLoans(data.pendingLoans);
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Show error message to admin
            // This is just a placeholder for error handling
        }
    };
    
    // Function to update stats cards with real data
    const updateStatsCards = (stats) => {
        // This would be implemented to update the stats cards with real data
        // For now, we'll leave it as a placeholder function
        console.log('Would update stats with:', stats);
    };
    
    // Function to update recent activity list
    const updateRecentActivity = (activities) => {
        // This would be implemented to update the activity list with real data
        // For now, we'll leave it as a placeholder function
        console.log('Would update activities with:', activities);
    };
    
    // Function to update pending loans table
    const updatePendingLoans = (loans) => {
        // This would be implemented to update the loans table with real data
        // For now, we'll leave it as a placeholder function
        console.log('Would update pending loans with:', loans);
    };
    
    // Call the fetchDashboardData function when the page loads
    // In a production environment, you might want to add error handling and loading states
    // fetchDashboardData();
    
    // Add navigation functionality
    const navLinks = document.querySelectorAll('.side-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            
            // Add active class to clicked link
            this.parentElement.classList.add('active');
            
            // Here you would handle actual navigation or tab switching
            const targetSection = this.getAttribute('href').substring(1);
            console.log(`Navigating to ${targetSection}`);
            
            // For a SPA, you would show/hide sections here
            // For demonstration, we'll just log it
        });
    });
    
    // Initialize any charts or visualizations
    const initializeCharts = () => {
        // This would be implemented to initialize charts
        // For now, we'll leave it as a placeholder function
        console.log('Would initialize charts here');
    };
    
    // Call initializers
    initializeCharts();
    
    // Handle search functionality
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    console.log(`Searching for: ${searchTerm}`);
                    // Here you would handle the search functionality
                    // For demonstration purposes only
                    alert(`Searching for: ${searchTerm}`);
                }
            }
        });
    }