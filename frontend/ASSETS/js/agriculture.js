// frontend/assets/js/agriculture.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      window.location.href = 'login.html';
      return;
    }
  
    // Load agriculture dashboard data
    loadAgricultureDashboard();
  
    // Set up event listeners
    setupEventListeners();
  });
  
  function setupEventListeners() {
    // Marketplace button
    const marketplaceBtn = document.getElementById('marketplaceBtn');
    if (marketplaceBtn) {
      marketplaceBtn.addEventListener('click', () => {
        window.location.href = 'marketplace.html';
      });
    }
    
    // Resources button
    const resourcesBtn = document.getElementById('resourcesBtn');
    if (resourcesBtn) {
      resourcesBtn.addEventListener('click', () => {
        window.location.href = 'resources.html';
      });
    }
    
    // Forum button
    const forumBtn = document.getElementById('forumBtn');
    if (forumBtn) {
      forumBtn.addEventListener('click', () => {
        window.location.href = 'forum.html';
      });
    }
    
    // Consultations button
    const consultationsBtn = document.getElementById('consultationsBtn');
    if (consultationsBtn) {
      consultationsBtn.addEventListener('click', () => {
        window.location.href = 'consultations.html';
      });
    }
    
    // Book consultation button
    const bookConsultationBtn = document.getElementById('bookConsultationBtn');
    if (bookConsultationBtn) {
      bookConsultationBtn.addEventListener('click', () => {
        showBookConsultationModal();
      });
    }
  }
  
  async function loadAgricultureDashboard() {
    try {
      window.app.showLoading();
      
      const response = await fetch('http://localhost:5000/api/agriculture/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load agriculture dashboard');
      }
      
      const data = await response.json();
      const dashboardData = data.data;
      
      // Update UI with dashboard data
      updateDashboardUI(dashboardData);
      
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading agriculture dashboard:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load agriculture dashboard', 'error');
    }
  }
  
  function updateDashboardUI(data) {
    // Update marketplace stats
    document.getElementById('activeListings').textContent = data.marketplace.activeListings;
    document.getElementById('myListings').textContent = data.marketplace.myListings;
    
    // Update resources stats
    document.getElementById('availableResources').textContent = data.resources.availableResources;
    document.getElementById('mySharedResources').textContent = data.resources.mySharedResources;
    
    // Update forum stats
    document.getElementById('totalPosts').textContent = data.forum.totalPosts;
    document.getElementById('myPosts').textContent = data.forum.myPosts;
    
    // Update recent marketplace items
    const marketItemsContainer = document.getElementById('recentMarketItems');
    if (marketItemsContainer && data.marketplace.recentItems) {
      marketItemsContainer.innerHTML = '';
      
      if (data.marketplace.recentItems.length === 0) {
        marketItemsContainer.innerHTML = `
          <div style="text-align: center; padding: 20px; color: var(--text-light);">
            No recent marketplace items
          </div>
        `;
      } else {
        data.marketplace.recentItems.forEach(item => {
          const itemElement = document.createElement('div');
          itemElement.className = 'marketplace-item';
          itemElement.style.display = 'flex';
          itemElement.style.alignItems = 'center';
          itemElement.style.padding = '15px';
          itemElement.style.borderBottom = '1px solid var(--border-color)';
          
          // Determine icon based on category
          let categoryIcon = 'box';
          if (item.category === 'crops') categoryIcon = 'seedling';
          if (item.category === 'livestock') categoryIcon = 'horse';
          if (item.category === 'equipment') categoryIcon = 'tools';
          if (item.category === 'services') categoryIcon = 'hands-helping';
          
          itemElement.innerHTML = `
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
              <i class="fas fa-${categoryIcon}"></i>
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 500; margin-bottom: 5px;">${item.title}</div>
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                <span>${window.app.formatCurrency(item.price)} ${item.priceUnit}</span>
                <span>${window.app.formatMarketCategory(item.category)}</span>
              </div>
            </div>
            <a href="marketplace.html?id=${item._id}" class="btn btn-small btn-outline">View</a>
          `;
          
          marketItemsContainer.appendChild(itemElement);
        });
      }
    }
    
    // Update recent forum posts
    const forumPostsContainer = document.getElementById('recentForumPosts');
    if (forumPostsContainer && data.forum.recentPosts) {
      forumPostsContainer.innerHTML = '';
      
      if (data.forum.recentPosts.length === 0) {
        forumPostsContainer.innerHTML = `
          <div style="text-align: center; padding: 20px; color: var(--text-light);">
            No recent forum posts
          </div>
        `;
      } else {
        data.forum.recentPosts.forEach(post => {
          const postElement = document.createElement('div');
          postElement.className = 'forum-post';
          postElement.style.padding = '15px';
          postElement.style.borderBottom = '1px solid var(--border-color)';
          
          // Format category
          const categoryFormatted = post.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          
          postElement.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 5px;">${post.title}</div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-light); margin-bottom: 10px;">
              <span>${post.author.firstName} ${post.author.lastName}</span>
              <span>${window.app.timeAgo(new Date(post.createdAt))}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
              <span>${categoryFormatted}</span>
              <span><i class="fas fa-comment"></i> ${post.comments.length} comments</span>
            </div>
            <div style="margin-top: 10px;">
              <a href="forum.html?id=${post._id}" class="btn btn-small btn-outline" style="width: 100%;">Read More</a>
            </div>
          `;
          
          forumPostsContainer.appendChild(postElement);
        });
      }
    }
    
    // Update upcoming consultations
    const consultationsContainer = document.getElementById('upcomingConsultations');
    if (consultationsContainer && data.consultations) {
      consultationsContainer.innerHTML = '';
      
      if (data.consultations.upcoming && data.consultations.upcoming.length === 0) {
        consultationsContainer.innerHTML = `
          <div style="text-align: center; padding: 20px; color: var(--text-light);">
            No upcoming consultations
          </div>
        `;
      } else if (data.consultations.upcoming) {
        data.consultations.upcoming.forEach(consultation => {
          const consultationElement = document.createElement('div');
          consultationElement.className = 'consultation';
          consultationElement.style.padding = '15px';
          consultationElement.style.borderBottom = '1px solid var(--border-color)';
          
          const scheduledDate = new Date(consultation.scheduledDate);
          const formattedDate = scheduledDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          consultationElement.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 5px;">${consultation.topic}</div>
            <div style="margin-bottom: 10px; font-size: 0.9rem;">
              <strong>Expert:</strong> ${consultation.expert.name} (${consultation.expert.specialty})
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-light);">
              <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
              <span><i class="fas fa-clock"></i> ${consultation.scheduledTime}</span>
            </div>
            <div style="margin-top: 10px;">
              <a href="consultations.html?id=${consultation._id}" class="btn btn-small btn-outline" style="width: 100%;">View Details</a>
            </div>
          `;
          
          consultationsContainer.appendChild(consultationElement);
        });
      }
    }
  }
  
  function showBookConsultationModal() {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <form id="consultationForm">
        <div class="form-group">
          <label for="expertSpecialty">Expert Specialty</label>
          <select id="expertSpecialty" name="expertSpecialty" class="form-control" required>
            <option value="">Select Specialty</option>
            <option value="crop-specialist">Crop Specialist</option>
            <option value="livestock-specialist">Livestock Specialist</option>
            <option value="soil-expert">Soil Expert</option>
            <option value="pest-control">Pest Control</option>
            <option value="irrigation-expert">Irrigation Expert</option>
            <option value="agricultural-finance">Agricultural Finance</option>
            <option value="market-analyst">Market Analyst</option>
            <option value="general-farming">General Farming</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="topic">Consultation Topic</label>
          <input type="text" id="topic" name="topic" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" class="form-control" rows="4" required></textarea>
        </div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label for="preferredDate">Preferred Date</label>
            <input type="date" id="preferredDate" name="preferredDate" class="form-control" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label for="alternativeDate">Alternative Date (Optional)</label>
            <input type="date" id="alternativeDate" name="alternativeDate" class="form-control">
          </div>
        </div>
        
        <div class="form-group">
          <label for="consultationType">Consultation Type</label>
          <select id="consultationType" name="consultationType" class="form-control" required>
            <option value="in-person">In Person</option>
            <option value="phone">Phone Call</option>
            <option value="video-call">Video Call</option>
          </select>
        </div>
      </form>
    `;
    
    window.app.createModal('Book Expert Consultation', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Book Consultation',
        class: 'btn',
        handler: () => requestConsultation()
      }
    ]);
    
    // Set minimum date for preferredDate to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('preferredDate').min = tomorrow.toISOString().split('T')[0];
    
    // Set minimum date for alternativeDate to day after tomorrow
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    document.getElementById('alternativeDate').min = dayAfterTomorrow.toISOString().split('T')[0];
  }
  
  async function requestConsultation() {
    // Get form data
    const expertSpecialty = document.getElementById('expertSpecialty').value;
    const topic = document.getElementById('topic').value;
    const description = document.getElementById('description').value;
    const preferredDate = document.getElementById('preferredDate').value;
    const alternativeDate = document.getElementById('alternativeDate').value;
    const consultationType = document.getElementById('consultationType').value;
    
    // Create expert object based on selected specialty
    const expertNames = {
      'crop-specialist': 'Dr. James Kamau',
      'livestock-specialist': 'Dr. Sarah Odhiambo',
      'soil-expert': 'Prof. David Mwangi',
      'pest-control': 'Dr. Elizabeth Njeri',
      'irrigation-expert': 'Eng. Joseph Kimani',
      'agricultural-finance': 'Ms. Jane Wanjiku',
      'market-analyst': 'Mr. Peter Omondi',
      'general-farming': 'Dr. Mary Mutua'
    };
    
    const expert = {
      name: expertNames[expertSpecialty] || 'Agricultural Expert',
      specialty: expertSpecialty.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      email: 'expert@agrisacco.com',
      phone: '+254712345678'
    };
    
    // Build consultation data
    const consultationData = {
      topic,
      description,
      preferredDate,
      consultationType,
      expert
    };
    
    // Add alternative date if provided
    if (alternativeDate) {
      consultationData.alternativeDate = alternativeDate;
    }
    
    try {
      window.app.showLoading();
      
      const response = await fetch('http://localhost:5000/api/agriculture/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(consultationData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to request consultation');
      }
      
      window.app.hideLoading();
      window.app.closeModal();
      
      // Show success message
      window.app.showToast('Consultation request submitted successfully', 'success');
      
      // Reload agriculture dashboard
      loadAgricultureDashboard();
    } catch (error) {
      window.app.hideLoading();
      console.error('Error requesting consultation:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  // Load success stories
  async function loadSuccessStories() {
    try {
      const response = await fetch('http://localhost:5000/api/agriculture/success-stories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load success stories');
      }
      
      const data = await response.json();
      const successStories = data.data;
      
      // Update UI with success stories
      updateSuccessStoriesUI(successStories);
    } catch (error) {
      console.error('Error loading success stories:', error);
      window.app.showToast('Failed to load success stories', 'error');
    }
  }
  
  function updateSuccessStoriesUI(successStories) {
    const storiesContainer = document.getElementById('successStories');
    if (!storiesContainer) return;
    
    // Clear container
    storiesContainer.innerHTML = '';
    
    if (successStories.length === 0) {
      storiesContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;">
            <i class="fas fa-star"></i>
          </div>
          <h3 style="margin-bottom: 20px;">No Success Stories Yet</h3>
          <p>Be the first to share your farming success story with the community!</p>
          <button id="shareSuccessStoryBtn" class="btn" style="margin-top: 20px;">Share Your Success Story</button>
        </div>
      `;
      
      // Add event listener to the share button
      document.getElementById('shareSuccessStoryBtn').addEventListener('click', () => {
        // Redirect to forum with success story pre-selected
        window.location.href = 'forum.html?action=post&category=success-story';
      });
      return;
    }
    
    // Create success stories grid
    successStories.forEach(story => {
      const storyCard = document.createElement('div');
      storyCard.className = 'success-story-card';
      
      const date = new Date(story.createdAt);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      storyCard.innerHTML = `
        <div class="success-story-header">
          <div class="success-story-author">
            <div class="author-avatar">
              ${story.author.firstName.charAt(0)}${story.author.lastName.charAt(0)}
            </div>
            <div class="author-info">
              <div class="author-name">${story.author.firstName} ${story.author.lastName}</div>
              <div class="story-date">${formattedDate}</div>
            </div>
          </div>
        </div>
        <div class="success-story-title">${story.title}</div>
        <div class="success-story-excerpt">
          ${story.content.substring(0, 150)}...
        </div>
        <div class="success-story-footer">
          <a href="forum.html?id=${story._id}" class="btn btn-small">Read Full Story</a>
        </div>
      `;
      
      storiesContainer.appendChild(storyCard);
    });
  }