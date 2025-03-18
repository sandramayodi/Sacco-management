// frontend/assets/js/notifications.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      window.location.href = 'login.html';
      return;
    }
  
    // Load notifications
    loadNotifications();
  
    // Set up event listeners
    setupEventListeners();
    
    // Set up real-time notification polling
    setupNotificationPolling();
  });
  
  function setupEventListeners() {
    // Mark all as read button
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        markAllNotificationsAsRead();
      });
    }
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.notification-filter-btn');
    if (filterButtons.length > 0) {
      filterButtons.forEach(button => {
        button.addEventListener('click', function() {
          // Remove active class from all buttons
          filterButtons.forEach(btn => btn.classList.remove('active'));
          
          // Add active class to clicked button
          this.classList.add('active');
          
          // Get filter type
          const filterType = this.getAttribute('data-filter');
          
          // Apply filter
          filterNotifications(filterType);
        });
      });
    }
  }
  
  function setupNotificationPolling() {
    // Poll for new notifications every 30 seconds
    setInterval(() => {
      checkForNewNotifications();
    }, 30000);
  }
  
  async function loadNotifications() {
    try {
      window.app.showLoading();
      
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load notifications');
      }
      
      const data = await response.json();
      const notifications = data.data;
      
      // Update UI with notifications
      updateNotificationsUI(notifications);
      
      // Update unread count in header
      updateUnreadCount();
      
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading notifications:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load notifications', 'error');
    }
  }
  
  function updateNotificationsUI(notifications) {
    const notificationsContainer = document.getElementById('notificationsContainer');
    if (!notificationsContainer) return;
    
    // Clear container
    notificationsContainer.innerHTML = '';
    
    if (notifications.length === 0) {
      notificationsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;">
            <i class="fas fa-bell-slash"></i>
          </div>
          <h3 style="margin-bottom: 20px;">No Notifications</h3>
          <p>You don't have any notifications at the moment.</p>
        </div>
      `;
      return;
    }
    
    // Group notifications by date
    const groupedNotifications = groupNotificationsByDate(notifications);
    
    // Create notification groups
    for (const [date, notifs] of Object.entries(groupedNotifications)) {
      const groupElement = document.createElement('div');
      groupElement.className = 'notification-group';
      
      // Add date header
      const dateHeader = document.createElement('div');
      dateHeader.className = 'notification-date-header';
      dateHeader.textContent = date;
      groupElement.appendChild(dateHeader);
      
      // Add notifications
      notifs.forEach(notification => {
        const notificationElement = createNotificationElement(notification);
        groupElement.appendChild(notificationElement);
      });
      
      notificationsContainer.appendChild(groupElement);
    }
  }
  
  function groupNotificationsByDate(notifications) {
    const groups = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey;
      
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(notification);
    });
    
    return groups;
  }
  
  function createNotificationElement(notification) {
    const element = document.createElement('div');
    element.className = 'notification-item';
    if (!notification.isRead) {
      element.classList.add('unread');
    }
    element.setAttribute('data-id', notification._id);
    element.setAttribute('data-type', notification.type);
    
    // Get icon based on notification type
    let iconClass = 'fas fa-bell';
    let iconColor = '#4CAF50';
    
    switch (notification.type) {
      case 'loan':
        iconClass = 'fas fa-hand-holding-usd';
        iconColor = '#FD7E14';
        break;
      case 'saving':
        iconClass = 'fas fa-piggy-bank';
        iconColor = '#28A745';
        break;
      case 'market':
        iconClass = 'fas fa-store';
        iconColor = '#FFC107';
        break;
      case 'resource':
        iconClass = 'fas fa-tractor';
        iconColor = '#17A2B8';
        break;
      case 'forum':
        iconClass = 'fas fa-comments';
        iconColor = '#6610F2';
        break;
      case 'consultation':
        iconClass = 'fas fa-user-md';
        iconColor = '#DC3545';
        break;
    }
    
    const timeAgo = window.app.timeAgo(new Date(notification.createdAt));
    
    element.innerHTML = `
      <div class="notification-icon" style="background-color: ${iconColor}20; color: ${iconColor};">
        <i class="${iconClass}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${timeAgo}</div>
      </div>
      <div class="notification-actions">
        ${!notification.isRead ? 
          `<button class="notification-mark-read" title="Mark as read">
            <i class="fas fa-check"></i>
          </button>` : ''
        }
        <button class="notification-delete" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    // Add event listeners
    element.addEventListener('click', function(e) {
      // Prevent clicks on buttons from triggering the entire notification
      if (e.target.closest('.notification-mark-read') || e.target.closest('.notification-delete')) {
        return;
      }
      
      // If notification is unread, mark it as read
      if (!notification.isRead) {
        markNotificationAsRead(notification._id);
      }
      
      // Handle notification click based on type and related ID
      handleNotificationClick(notification);
    });
    
    // Mark as read button
    const markReadBtn = element.querySelector('.notification-mark-read');
    if (markReadBtn) {
      markReadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        markNotificationAsRead(notification._id);
      });
    }
    
    // Delete button
    const deleteBtn = element.querySelector('.notification-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNotification(notification._id);
      });
    }
    
    return element;
  }
  
  function handleNotificationClick(notification) {
    // Navigate based on notification type and related ID
    if (notification.relatedId) {
      switch (notification.type) {
        case 'loan':
          window.location.href = `loans.html?id=${notification.relatedId}`;
          break;
        case 'saving':
          window.location.href = 'savings.html';
          break;
        case 'market':
          window.location.href = `marketplace.html?id=${notification.relatedId}`;
          break;
        case 'resource':
          window.location.href = `resources.html?id=${notification.relatedId}`;
          break;
        case 'forum':
          window.location.href = `forum.html?id=${notification.relatedId}`;
          break;
        case 'consultation':
          window.location.href = `consultations.html?id=${notification.relatedId}`;
          break;
        default:
          // General notifications just mark as read
          break;
      }
    } else {
      // Navigate to main page for notification type
      switch (notification.type) {
        case 'loan':
          window.location.href = 'loans.html';
          break;
        case 'saving':
          window.location.href = 'savings.html';
          break;
        case 'market':
          window.location.href = 'marketplace.html';
          break;
        case 'resource':
          window.location.href = 'resources.html';
          break;
        case 'forum':
          window.location.href = 'forum.html';
          break;
        case 'consultation':
          window.location.href = 'consultations.html';
          break;
      }
    }
  }
  
  async function markNotificationAsRead(notificationId) {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update UI
      const notificationElement = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
      if (notificationElement) {
        notificationElement.classList.remove('unread');
        const markReadBtn = notificationElement.querySelector('.notification-mark-read');
        if (markReadBtn) {
          markReadBtn.remove();
        }
      }
      
      // Update unread count
      updateUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      window.app.showToast('Failed to mark notification as read', 'error');
    }
  }
  
  async function markAllNotificationsAsRead() {
    try {
      window.app.showLoading();
      
      const response = await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      window.app.hideLoading();
      
      // Update UI
      const unreadNotifications = document.querySelectorAll('.notification-item.unread');
      unreadNotifications.forEach(notification => {
        notification.classList.remove('unread');
        const markReadBtn = notification.querySelector('.notification-mark-read');
        if (markReadBtn) {
          markReadBtn.remove();
        }
      });
      
      // Update unread count
      updateUnreadCount();
      
      // Show success message
      window.app.showToast('All notifications marked as read', 'success');
    } catch (error) {
      window.app.hideLoading();
      console.error('Error marking all notifications as read:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  async function deleteNotification(notificationId) {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      // Remove notification from UI
      const notificationElement = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
      if (notificationElement) {
        // Check if this is the last notification in its group
        const group = notificationElement.closest('.notification-group');
        const groupItems = group.querySelectorAll('.notification-item');
        
        if (groupItems.length === 1) {
          // If this is the last notification in the group, remove the entire group
          group.remove();
        } else {
          // Otherwise just remove this notification
          notificationElement.remove();
        }
      }
      
      // Check if we need to show empty state
      const remainingNotifications = document.querySelectorAll('.notification-item');
      if (remainingNotifications.length === 0) {
        const notificationsContainer = document.getElementById('notificationsContainer');
        notificationsContainer.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <div style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;">
              <i class="fas fa-bell-slash"></i>
            </div>
            <h3 style="margin-bottom: 20px;">No Notifications</h3>
            <p>You don't have any notifications at the moment.</p>
          </div>
        `;
      }
      
      // Update unread count
      updateUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
      window.app.showToast('Failed to delete notification', 'error');
    }
  }
  
  function filterNotifications(filterType) {
    // Get all notification items
    const notifications = document.querySelectorAll('.notification-item');
    
    // Show all notifications if filter is 'all'
    if (filterType === 'all') {
      notifications.forEach(notification => {
        notification.style.display = 'flex';
      });
    } else {
      // Otherwise, show only notifications of the selected type
      notifications.forEach(notification => {
        const notificationType = notification.getAttribute('data-type');
        if (notificationType === filterType) {
          notification.style.display = 'flex';
        } else {
          notification.style.display = 'none';
        }
      });
    }
    
    // Check if any notifications are visible
    const visibleNotifications = Array.from(notifications).filter(
      notification => notification.style.display !== 'none'
    );
    
    // Show empty state if no notifications are visible
    if (visibleNotifications.length === 0) {
      const notificationsContainer = document.getElementById('notificationsContainer');
      // Check if empty state already exists
      if (!document.querySelector('.empty-state')) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.style.textAlign = 'center';
        emptyState.style.padding = '40px';
        
        emptyState.innerHTML = `
          <div style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;">
            <i class="fas fa-filter"></i>
          </div>
          <h3 style="margin-bottom: 20px;">No ${filterType} Notifications</h3>
          <p>You don't have any ${filterType} notifications at the moment.</p>
        `;
        
        notificationsContainer.appendChild(emptyState);
      }
    } else {
      // Remove empty state if notifications are visible
      const emptyState = document.querySelector('.empty-state');
      if (emptyState) {
        emptyState.remove();
      }
    }
    
    // Update visibility of notification groups
    updateGroupVisibility();
  }
  
  function updateGroupVisibility() {
    // Get all notification groups
    const groups = document.querySelectorAll('.notification-group');
    
    groups.forEach(group => {
      // Check if any notifications in this group are visible
      const visibleNotifications = Array.from(group.querySelectorAll('.notification-item')).filter(
        notification => notification.style.display !== 'none'
      );
      
      // Hide group if no notifications are visible
      if (visibleNotifications.length === 0) {
        group.style.display = 'none';
      } else {
        group.style.display = 'block';
      }
      
      // Make sure date header is always visible if group is visible
      const dateHeader = group.querySelector('.notification-date-header');
      if (dateHeader) {
        dateHeader.style.display = group.style.display;
      }
    });
  }
  
  async function updateUnreadCount() {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/unread/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get unread count');
      }
      
      const data = await response.json();
      const count = data.count;
      
      // Update unread count in header
      const notificationBadge = document.getElementById('notificationBadge');
      if (notificationBadge) {
        notificationBadge.textContent = count;
        notificationBadge.style.display = count > 0 ? 'flex' : 'none';
      }
      
      // Update unread count in page header if it exists
      const pageUnreadCount = document.getElementById('unreadCount');
      if (pageUnreadCount) {
        pageUnreadCount.textContent = count;
      }
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  }
  
  async function checkForNewNotifications() {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/unread/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to check for new notifications');
      }
      
      const data = await response.json();
      const count = data.count;
      
      // Get current unread count
      const notificationBadge = document.getElementById('notificationBadge');
      const currentCount = notificationBadge ? parseInt(notificationBadge.textContent || '0') : 0;
      
      // If there are new notifications, reload them
      if (count > currentCount) {
        // Show notification toast
        const newCount = count - currentCount;
        window.app.showToast(`You have ${newCount} new notification${newCount > 1 ? 's' : ''}`, 'info');
        
        // Reload notifications
        loadNotifications();
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  }
  
  // Initialize dropdown notification functionality
  function initializeNotificationDropdown() {
    const notificationToggle = document.getElementById('notificationToggle');
    const notificationContainer = document.getElementById('notificationContainer');
    const markAllReadBtn = document.getElementById('markAllRead');
    
    if (!notificationToggle || !notificationContainer) return;
    
    // Toggle notification panel
    notificationToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const isVisible = notificationContainer.style.display === 'block';
      notificationContainer.style.display = isVisible ? 'none' : 'block';
      
      // If opening, load notifications
      if (!isVisible) {
        loadDropdownNotifications();
      }
    });
    
    // Close when clicking outside
    document.addEventListener('click', function(e) {
      if (notificationContainer.style.display === 'block' && 
          !notificationToggle.contains(e.target) && 
          !notificationContainer.contains(e.target)) {
        notificationContainer.style.display = 'none';
      }
    });
    
    // Mark all as read
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        markAllNotificationsAsRead();
      });
    }
  }
  
  async function loadDropdownNotifications() {
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load notifications');
      }
      
      const data = await response.json();
      const notifications = data.data;
      
      // Get notification list container
      const notificationList = document.getElementById('notificationList');
      if (!notificationList) return;
      
      // Clear container
      notificationList.innerHTML = '';
      
      if (notifications.length === 0) {
        notificationList.innerHTML = `
          <div style="padding: 15px; text-align: center; color: var(--text-light);">
            No notifications
          </div>
        `;
        return;
      }
      
      // Add recent notifications (limit to 5)
      const recentNotifications = notifications.slice(0, 5);
      
      recentNotifications.forEach(notification => {
        const element = document.createElement('div');
        element.className = 'dropdown-notification-item';
        if (!notification.isRead) {
          element.classList.add('unread');
        }
        
        // Get icon based on notification type
        let iconClass = 'fas fa-bell';
        
        switch (notification.type) {
          case 'loan':
            iconClass = 'fas fa-hand-holding-usd';
            break;
          case 'saving':
            iconClass = 'fas fa-piggy-bank';
            break;
          case 'market':
            iconClass = 'fas fa-store';
            break;
          case 'resource':
            iconClass = 'fas fa-tractor';
            break;
          case 'forum':
            iconClass = 'fas fa-comments';
            break;
          case 'consultation':
            iconClass = 'fas fa-user-md';
            break;
        }
        
        element.innerHTML = `
          <div class="dropdown-notification-icon">
            <i class="${iconClass}"></i>
          </div>
          <div class="dropdown-notification-content">
            <div class="dropdown-notification-title">${notification.title}</div>
            <div class="dropdown-notification-message">${notification.message}</div>
            <div class="dropdown-notification-time">${window.app.timeAgo(new Date(notification.createdAt))}</div>
          </div>
          ${!notification.isRead ? '<div class="dropdown-notification-unread"></div>' : ''}
        `;
        
        // Add click handler
        element.addEventListener('click', function() {
          // Mark as read if unread
          if (!notification.isRead) {
            markNotificationAsRead(notification._id);
          }
          
          // Handle navigation based on notification type
          handleNotificationClick(notification);
          
          // Close dropdown
          document.getElementById('notificationContainer').style.display = 'none';
        });
        
        notificationList.appendChild(element);
      });
      
      // Add view all link
      const viewAllLink = document.createElement('div');
      viewAllLink.style.padding = '10px';
      viewAllLink.style.textAlign = 'center';
      viewAllLink.style.borderTop = '1px solid var(--border-color)';
      viewAllLink.innerHTML = `
        <a href="notifications.html" style="color: var(--primary-color); font-size: 0.9rem;">View all notifications</a>
      `;
      notificationList.appendChild(viewAllLink);
      
      // Update unread count
      updateUnreadCount();
    } catch (error) {
      console.error('Error loading dropdown notifications:', error);
      
      // Show error in dropdown
      const notificationList = document.getElementById('notificationList');
      if (notificationList) {
        notificationList.innerHTML = `
          <div style="padding: 15px; text-align: center; color: var(--danger-color);">
            Failed to load notifications
          </div>
        `;
      }
    }
  }
  
  // Initialize dropdown when document loads
  document.addEventListener('DOMContentLoaded', function() {
    initializeNotificationDropdown();
  });