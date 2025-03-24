// Agricultural Expert Dashboard JavaScript

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
            alert('You have 7 new notifications:\n- 3 new forum posts needing expert input\n- 2 consultation requests\n- 2 loan reviews pending');
        });
    }
    
    // Messages dropdown functionality
    const messageIcon = document.querySelector('.message-icon');
    if (messageIcon) {
        messageIcon.addEventListener('click', function(e) {
            // Here you would toggle a messages dropdown
            console.log('Messages clicked');
            // For demonstration purposes only
            alert('You have 5 unread messages from Sacco members');
        });
    }
    
    // Handle start consultation button
    const startButtons = document.querySelectorAll('.btn-action.start');
    startButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const row = this.closest('tr');
            const memberName = row.cells[1].textContent;
            const topic = row.cells[2].textContent;
            const consultationMethod = row.cells[3].textContent;
            
            // Here you would start the consultation (launch video call, etc.)
            console.log(`Starting consultation with ${memberName} on ${topic} via ${consultationMethod}`);
            
            // For demonstration purposes only
            alert(`Initiating ${consultationMethod} with ${memberName}\nTopic: ${topic}`);
        });
    });
    
    // Handle reschedule consultation button
    const rescheduleButtons = document.querySelectorAll('.btn-action.reschedule');
    rescheduleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const row = this.closest('tr');
            const memberName = row.cells[1].textContent;
            
            // Here you would open a reschedule modal/form
            console.log(`Opening reschedule form for consultation with ${memberName}`);
            
            // For demonstration purposes only
            const newDate = prompt(`Enter new date and time for consultation with ${memberName}:`, "Mar 25, 2025 11:00 AM");
            if (newDate) {
                alert(`Consultation with ${memberName} rescheduled to ${newDate}`);
            }
        });
    });
    
    // Handle prepare for consultation button
    const prepareButtons = document.querySelectorAll('.btn-action.prepare');
    prepareButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const row = this.closest('tr');
            const memberName = row.cells[1].textContent;
            const topic = row.cells[2].textContent;
            
            // Here you would open the preparation page/form
            console.log(`Opening preparation materials for consultation with ${memberName} on ${topic}`);
            
            // For demonstration purposes only
            alert(`Loading consultation preparation materials for:\nMember: ${memberName}\nTopic: ${topic}`);
        });
    });
    
    // Handle view notes button
    const viewNotesButtons = document.querySelectorAll('.btn-action.view-notes');
    viewNotesButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const row = this.closest('tr');
            const memberName = row.cells[1].textContent;
            
            // Here you would open the notes view
            console.log(`Opening consultation notes for ${memberName}`);
            
            // For demonstration purposes only
            alert(`Consultation Notes for ${memberName}:\n- Discussed crop rotation for maize and beans\n- Recommended soil testing before next planting season\n- Shared resource links for best practices`);
        });
    });
    
    // Handle forum respond buttons
    const respondButtons = document.querySelectorAll('.btn-action.respond');
    respondButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const forumItem = this.closest('.forum-item');
            const topicTitle = forumItem.querySelector('h3').textContent;
            
            // Here you would open the forum response form/page
            console.log(`Opening response form for "${topicTitle}"`);
            
            // For demonstration purposes only
            alert(`You are about to respond to the forum topic:\n"${topicTitle}"\n\nPlease navigate to the forum to provide your expert input.`);
        });
    });
    
    // Handle loan review buttons
    const reviewButtons = document.querySelectorAll('.btn-action.review');
    reviewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const row = this.closest('tr');
            const requestId = row.cells[0].textContent;
            const memberName = row.cells[1].textContent;
            const loanPurpose = row.cells[2].textContent;
            
            // Here you would open the loan review form/page
            console.log(`Opening loan review form for ${requestId} - ${memberName} - ${loanPurpose}`);
            
            // For demonstration purposes only
            alert(`Opening technical review form for:\nRequest ID: ${requestId}\nMember: ${memberName}\nPurpose: ${loanPurpose}\n\nPlease provide your agricultural expertise assessment for this loan application.`);
        });
    });
    
    // Handle edit article buttons
    const editButtons = document.querySelectorAll('.btn-action.edit');
    editButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const articleItem = this.closest('.article-item');
            const articleTitle = articleItem.querySelector('h3').textContent;
            
            // Here you would open the article editor
            console.log(`Opening editor for "${articleTitle}"`);
            
            // For demonstration purposes only
            alert(`Opening the knowledge base article editor for:\n"${articleTitle}"`);
        });
    });
    
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
            
            // For demonstration purposes only - in a real app, you'd show/hide sections
            if (targetSection === 'create-new') {
                alert('Opening new knowledge base article editor');
            }
        });
    });
    
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
                    alert(`Searching for: ${searchTerm} across consultations, forum posts, and knowledge base`);
                }
            }
        });
    }
    
    // API mock for fetching data
    const fetchExpertData = async () => {
        // In a real application, this would be an actual API call
        console.log('Fetching expert dashboard data');
        
        // Mock data that would be returned from the backend
        return {
            consultations: [
                // Consultation data would go here
            ],
            forumTopics: [
                // Forum topics would go here
            ],
            loanReviews: [
                // Loan reviews would go here
            ],
            articles: [
                // Knowledge base articles would go here
            ],
            stats: {
                consultationsToday: 5,
                forumContributions: 124,
                loanReviewsPending: 8,
                membersHelped: 1458
            }
        };
    };
    
    // Initialize dashboard - in a real app, this would update the UI with real data
    const initializeDashboard = async () => {
        try {
            const data = await fetchExpertData();
            console.log('Dashboard data loaded:', data);
            // Here you would update the UI with the fetched data
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };
    
    // Call initializer
    // initializeDashboard();
});