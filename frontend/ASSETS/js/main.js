// frontend/assets/js/main.js

// Check authentication status on all pages except login and register
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const publicPaths = ['/login.html', '/register.html', '/index.html', '/'];
    
    // Skip auth check for public pages
    if (publicPaths.some(path => currentPath.includes(path))) {
      return;
    }
    
    // Check if user is logged in
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      window.location.href = 'login.html';
      return;
    }
    
    // Verify token validity by making a request to the API
    fetch('http://localhost:5000/api/members/me', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Token invalid');
      }
      return response.json();
    })
    .then(data => {
      // Update user data in localStorage
      localStorage.setItem('memberData', JSON.stringify(data.data));
    })
    .catch(error => {
      console.error('Authentication error:', error);
      // Clear invalid token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('memberData');
      window.location.href = 'login.html';
    });
  });
  
  // Format currency
  function formatCurrency(amount) {
    return 'KES ' + amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  // Format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Format date and time
  function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Calculate time ago
  function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
  }
  
  // Get URL parameters
  function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    for (const [key, value] of urlParams.entries()) {
      params[key] = value;
    }
    
    return params;
  }
  
  // Show toast notification
  function showToast(message, type = 'success') {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.right = '20px';
      toast.style.padding = '12px 20px';
      toast.style.borderRadius = '4px';
      toast.style.color = 'white';
      toast.style.zIndex = '1000';
      toast.style.transition = 'opacity 0.3s ease';
      toast.style.opacity = '0';
      document.body.appendChild(toast);
    }
    
    // Set toast type
    if (type === 'success') {
      toast.style.backgroundColor = 'var(--success-color)';
    } else if (type === 'error') {
      toast.style.backgroundColor = 'var(--danger-color)';
    } else if (type === 'warning') {
      toast.style.backgroundColor = 'var(--warning-color)';
    } else {
      toast.style.backgroundColor = 'var(--info-color)';
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.style.opacity = '1';
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 3000);
  }
  
  // Show loading spinner
  function showLoading() {
    let loadingOverlay = document.getElementById('loadingOverlay');
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'loadingOverlay';
      loadingOverlay.style.position = 'fixed';
      loadingOverlay.style.top = '0';
      loadingOverlay.style.left = '0';
      loadingOverlay.style.width = '100%';
      loadingOverlay.style.height = '100%';
      loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      loadingOverlay.style.display = 'flex';
      loadingOverlay.style.alignItems = 'center';
      loadingOverlay.style.justifyContent = 'center';
      loadingOverlay.style.zIndex = '2000';
      
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      spinner.style.width = '50px';
      spinner.style.height = '50px';
      spinner.style.border = '5px solid #f3f3f3';
      spinner.style.borderTop = '5px solid var(--primary-color)';
      spinner.style.borderRadius = '50%';
      spinner.style.animation = 'spin 1s linear infinite';
      
      // Add keyframes for the spinner animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      
      loadingOverlay.appendChild(spinner);
      document.body.appendChild(loadingOverlay);
    }
    
    loadingOverlay.style.display = 'flex';
  }
  
  // Hide loading spinner
  function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }
  
  // API request helper with authentication
  async function apiRequest(endpoint, options = {}) {
    const authToken = localStorage.getItem('authToken');
    
    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Add auth token if available
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Prepare request options
    const requestOptions = {
      ...options,
      headers
    };
    
    try {
      const response = await fetch(`http://localhost:5000/api/${endpoint}`, requestOptions);
      
      // Handle unauthorized response
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('memberData');
        window.location.href = 'login.html';
        return null;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }
  
  // Create a modal dialog
  function createModal(title, content, actions) {
    // Remove any existing modal
    const existingModal = document.getElementById('modalContainer');
    if (existingModal) {
      document.body.removeChild(existingModal);
    }
    
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    modalContainer.className = 'modal';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Create modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('div');
    modalTitle.className = 'modal-title';
    modalTitle.textContent = title;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      closeModal();
    });
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    // Create modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    if (typeof content === 'string') {
      modalBody.innerHTML = content;
    } else {
      modalBody.appendChild(content);
    }
    
    // Create modal footer with actions
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    if (actions) {
      actions.forEach(action => {
        const button = document.createElement('button');
        button.className = action.class || 'btn';
        button.textContent = action.text;
        button.addEventListener('click', action.handler);
        modalFooter.appendChild(button);
      });
    }
    
    // Assemble modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalContainer.appendChild(modalContent);
    
    // Add modal to document
    document.body.appendChild(modalContainer);
    
    // Show modal
    setTimeout(() => {
      modalContainer.classList.add('active');
    }, 10);
    
    // Close when clicking outside
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        closeModal();
      }
    });
    
    return modalContainer;
  }
  
  // Close modal
  function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
      modalContainer.classList.remove('active');
      setTimeout(() => {
        modalContainer.remove();
      }, 300);
    }
  }
  
  // Confirm dialog
  function confirmDialog(title, message, confirmHandler, cancelHandler = null) {
    const content = `<p>${message}</p>`;
    
    const actions = [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => {
          closeModal();
          if (cancelHandler) cancelHandler();
        }
      },
      {
        text: 'Confirm',
        class: 'btn btn-danger',
        handler: () => {
          closeModal();
          confirmHandler();
        }
      }
    ];
    
    createModal(title, content, actions);
  }
  
  // Format phone number
  function formatPhoneNumber(phoneNumber) {
    // Example: +254712345678 -> +254 712 345 678
    if (!phoneNumber) return '';
    
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    
    if (cleaned.startsWith('254')) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    } else if (cleaned.startsWith('0')) {
      return `+254 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    } else {
      return phoneNumber;
    }
  }
  
  // Form validation helper
  function validateForm(formData, rules) {
    const errors = {};
    
    for (const field in rules) {
      const value = formData[field];
      const fieldRules = rules[field];
      
      // Required validation
      if (fieldRules.required && (!value || value.trim() === '')) {
        errors[field] = `${fieldRules.label || field} is required`;
        continue;
      }
      
      // Skip other validations if value is empty and not required
      if (!value || value.trim() === '') {
        continue;
      }
      
      // Minimum length validation
      if (fieldRules.minLength && value.length < fieldRules.minLength) {
        errors[field] = `${fieldRules.label || field} must be at least ${fieldRules.minLength} characters`;
        continue;
      }
      
      // Maximum length validation
      if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
        errors[field] = `${fieldRules.label || field} must not exceed ${fieldRules.maxLength} characters`;
        continue;
      }
      
      // Email validation
      if (fieldRules.isEmail && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
        errors[field] = `${fieldRules.label || field} must be a valid email address`;
        continue;
      }
      
      // Number validation
      if (fieldRules.isNumber && isNaN(Number(value))) {
        errors[field] = `${fieldRules.label || field} must be a number`;
        continue;
      }
      
      // Minimum value validation
      if (fieldRules.min !== undefined && Number(value) < fieldRules.min) {
        errors[field] = `${fieldRules.label || field} must be greater than or equal to ${fieldRules.min}`;
        continue;
      }
      
      // Maximum value validation
      if (fieldRules.max !== undefined && Number(value) > fieldRules.max) {
        errors[field] = `${fieldRules.label || field} must be less than or equal to ${fieldRules.max}`;
        continue;
      }
      
      // Pattern validation
      if (fieldRules.pattern && !new RegExp(fieldRules.pattern).test(value)) {
        errors[field] = fieldRules.patternMessage || `${fieldRules.label || field} format is invalid`;
        continue;
      }
      
      // Custom validation
      if (fieldRules.validate && typeof fieldRules.validate === 'function') {
        const error = fieldRules.validate(value, formData);
        if (error) {
          errors[field] = error;
          continue;
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
  
  // Show validation errors on form
  function showValidationErrors(errors, formId) {
    const form = document.getElementById(formId);
    
    // Remove any existing error messages
    const existingErrors = form.querySelectorAll('.validation-error');
    existingErrors.forEach(error => error.remove());
    
    // Reset error styles on inputs
    const inputs = form.querySelectorAll('.form-control');
    inputs.forEach(input => {
      input.style.borderColor = '';
    });
    
    // If no errors, return
    if (Object.keys(errors).length === 0) {
      return;
    }
    
    // Add error messages and styles
    for (const field in errors) {
      const input = form.querySelector(`[name="${field}"]`);
      if (input) {
        // Add error style to input
        input.style.borderColor = 'var(--danger-color)';
        
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'validation-error';
        errorElement.style.color = 'var(--danger-color)';
        errorElement.style.fontSize = '0.8rem';
        errorElement.style.marginTop = '5px';
        errorElement.textContent = errors[field];
        
        // Add error message after input
        input.parentNode.appendChild(errorElement);
      }
    }
  }
  
  // Calculate loan repayment schedule
  function calculateLoanSchedule(principal, interestRate, term) {
    const monthlyInterestRate = interestRate / 100 / 12;
    const monthlyPayment = 
      (principal * monthlyInterestRate) / 
      (1 - Math.pow(1 + monthlyInterestRate, -term));
    
    const schedule = [];
    
    let remainingPrincipal = principal;
    
    for (let i = 1; i <= term; i++) {
      const interestPayment = remainingPrincipal * monthlyInterestRate;
      const principalPayment = monthlyPayment - interestPayment;
      
      remainingPrincipal -= principalPayment;
      
      // In case of rounding errors for the last payment
      if (i === term) {
        schedule.push({
          installmentNumber: i,
          dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000), // Approximately one month
          amount: principalPayment + interestPayment + remainingPrincipal,
          principal: principalPayment + remainingPrincipal,
          interest: interestPayment,
          balance: 0
        });
      } else {
        schedule.push({
          installmentNumber: i,
          dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000), // Approximately one month
          amount: monthlyPayment,
          principal: principalPayment,
          interest: interestPayment,
          balance: remainingPrincipal
        });
      }
    }
    
    return {
      schedule,
      totalPayment: monthlyPayment * term,
      monthlyPayment,
      totalInterest: (monthlyPayment * term) - principal
    };
  }
  
  // Format loan status for display
  function formatLoanStatus(status) {
    const statusMap = {
      'applied': 'Applied',
      'under-review': 'Under Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'disbursed': 'Disbursed',
      'repaying': 'Repaying',
      'fully-paid': 'Fully Paid',
      'defaulted': 'Defaulted'
    };
    
    return statusMap[status] || status;
  }
  
  // Format transaction type for display
  function formatTransactionType(type) {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Calculate savings goal progress
  function calculateSavingsProgress(current, target) {
    return Math.min(Math.round((current / target) * 100), 100);
  }
  
  // Format resource type for display
  function formatResourceType(type) {
    const typeMap = {
      'land': 'Land',
      'tractor': 'Tractor',
      'irrigation-equipment': 'Irrigation Equipment',
      'processing-machine': 'Processing Machine',
      'storage-facility': 'Storage Facility',
      'other': 'Other'
    };
    
    return typeMap[type] || type;
  }
  
  // Format marketplace category for display
  function formatMarketCategory(category) {
    const categoryMap = {
      'crops': 'Crops',
      'livestock': 'Livestock',
      'equipment': 'Equipment',
      'services': 'Services',
      'other': 'Other'
    };
    
    return categoryMap[category] || category;
  }
  
  // Upload file helper
  async function uploadFile(file, endpoint) {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
      throw new Error('Authentication required');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`http://localhost:5000/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'File upload failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }
  
  // Get user role
  function getUserRole() {
    const memberData = JSON.parse(localStorage.getItem('memberData') || '{}');
    return memberData.role || 'member';
  }
  
  // Check if user is admin
  function isAdmin() {
    return getUserRole() === 'admin';
  }
  
  // Generate random ID for temporary use
  function generateTempId() {
    return 'temp_' + Math.random().toString(36).substr(2, 9);
  }
  
  // Export functionality for reuse in other scripts
  window.app = {
    formatCurrency,
    formatDate,
    formatDateTime,
    timeAgo,
    getUrlParams,
    showToast,
    showLoading,
    hideLoading,
    apiRequest,
    createModal,
    closeModal,
    confirmDialog,
    formatPhoneNumber,
    validateForm,
    showValidationErrors,
    calculateLoanSchedule,
    formatLoanStatus,
    formatTransactionType,
    calculateSavingsProgress,
    formatResourceType,
    formatMarketCategory,
    uploadFile,
    getUserRole,
    isAdmin,
    generateTempId
  };