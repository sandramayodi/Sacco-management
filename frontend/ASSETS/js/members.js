// frontend/assets/js/members.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      window.location.href = 'login.html';
      return;
    }
  
    // Load member profile data
    loadMemberProfile();
  
    // Initialize UI elements
    initUI();
  
    // Set up event listeners
    setupEventListeners();
  });
  
  async function loadMemberProfile() {
    try {
      // Show loading spinner
      window.app.showLoading();
  
      // Fetch member profile
      const response = await fetch('http://localhost:5000/api/members/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }
  
      const data = await response.json();
      const member = data.data;
  
      // Update profile information
      updateProfileUI(member);
  
      // Hide loading spinner
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading profile:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load profile data', 'error');
    }
  }
  
  function updateProfileUI(member) {
    // Update personal information
    document.getElementById('memberName').textContent = `${member.firstName} ${member.lastName}`;
    document.getElementById('memberEmail').textContent = member.email;
    document.getElementById('memberPhone').textContent = member.phone;
    document.getElementById('memberAddress').textContent = member.address;
    document.getElementById('memberNationalId').textContent = member.nationalId;
    document.getElementById('membershipDate').textContent = new Date(member.membershipDate).toLocaleDateString();
    
    // Update farm information
    document.getElementById('farmSize').textContent = `${member.farmSize} acres`;
    document.getElementById('farmLocation').textContent = member.farmLocation;
    document.getElementById('mainCrops').textContent = member.mainCrops.join(', ') || 'None specified';
    document.getElementById('mainLivestock').textContent = member.mainLivestock.join(', ') || 'None specified';
    
    // Update financial information
    document.getElementById('shareCapital').textContent = `KES ${member.shareCapital.toLocaleString()}`;
    
    // Update profile image if available
    const profileImage = document.getElementById('profileImage');
    if (profileImage && member.profileImage) {
      profileImage.src = member.profileImage;
    }
    
    // Set verified badge if member is verified
    const verifiedBadge = document.getElementById('verifiedBadge');
    if (verifiedBadge) {
      verifiedBadge.style.display = member.verified ? 'inline-block' : 'none';
    }
  }
  
  function initUI() {
    // Set up tabs if present
    const tabs = document.querySelectorAll('.profile-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabs.length > 0) {
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          // Remove active class from all tabs
          tabs.forEach(t => t.classList.remove('active'));
          
          // Add active class to clicked tab
          tab.classList.add('active');
          
          // Hide all tab contents
          tabContents.forEach(content => content.style.display = 'none');
          
          // Show selected tab content
          const tabId = tab.getAttribute('data-tab');
          document.getElementById(tabId).style.display = 'block';
        });
      });
      
      // Set first tab as active by default
      tabs[0].click();
    }
  }
  
  function setupEventListeners() {
    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        showEditProfileModal();
      });
    }
    
    // Change password button
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', () => {
        showChangePasswordModal();
      });
    }
    
    // Add share capital button
    const addShareCapitalBtn = document.getElementById('addShareCapitalBtn');
    if (addShareCapitalBtn) {
      addShareCapitalBtn.addEventListener('click', () => {
        showAddShareCapitalModal();
      });
    }
  }
  
  function showEditProfileModal() {
    // Fetch current profile data
    fetch('http://localhost:5000/api/members/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
    .then(response => response.json())
    .then(data => {
      const member = data.data;
      
      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.innerHTML = `
        <form id="editProfileForm">
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="firstName">First Name</label>
              <input type="text" id="firstName" name="firstName" class="form-control" value="${member.firstName}" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="lastName">Last Name</label>
              <input type="text" id="lastName" name="lastName" class="form-control" value="${member.lastName}" required>
            </div>
          </div>
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone" class="form-control" value="${member.phone}" required>
          </div>
          <div class="form-group">
            <label for="address">Physical Address</label>
            <input type="text" id="address" name="address" class="form-control" value="${member.address}" required>
          </div>
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="farmSize">Farm Size (acres)</label>
              <input type="number" id="farmSize" name="farmSize" min="0" step="0.1" class="form-control" value="${member.farmSize}" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="farmLocation">Farm Location</label>
              <input type="text" id="farmLocation" name="farmLocation" class="form-control" value="${member.farmLocation}" required>
            </div>
          </div>
          <div class="form-group">
            <label for="mainCrops">Main Crops (comma separated)</label>
            <input type="text" id="mainCrops" name="mainCrops" class="form-control" value="${member.mainCrops.join(', ')}">
          </div>
          <div class="form-group">
            <label for="mainLivestock">Main Livestock (comma separated)</label>
            <input type="text" id="mainLivestock" name="mainLivestock" class="form-control" value="${member.mainLivestock.join(', ')}">
          </div>
        </form>
      `;
      
      // Show modal
      window.app.createModal('Edit Profile', modalContent, [
        {
          text: 'Cancel',
          class: 'btn btn-outline',
          handler: () => window.app.closeModal()
        },
        {
          text: 'Save Changes',
          class: 'btn',
          handler: () => updateProfile()
        }
      ]);
    })
    .catch(error => {
      console.error('Error fetching profile data:', error);
      window.app.showToast('Failed to load profile data', 'error');
    });
  }
  
  async function updateProfile() {
    const formData = {
      firstName: document.getElementById('firstName').value,
      lastName: document.getElementById('lastName').value,
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value,
      farmSize: document.getElementById('farmSize').value,
      farmLocation: document.getElementById('farmLocation').value,
      mainCrops: document.getElementById('mainCrops').value.split(',').map(crop => crop.trim()).filter(crop => crop !== ''),
      mainLivestock: document.getElementById('mainLivestock').value.split(',').map(livestock => livestock.trim()).filter(livestock => livestock !== '')
    };
    
    try {
      const response = await fetch('http://localhost:5000/api/members/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }
      
      // Close modal
      window.app.closeModal();
      
      // Reload profile data
      loadMemberProfile();
      
      // Show success message
      window.app.showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  function showChangePasswordModal() {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <form id="changePasswordForm">
        <div class="form-group">
          <label for="currentPassword">Current Password</label>
          <input type="password" id="currentPassword" name="currentPassword" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="newPassword">New Password</label>
          <input type="password" id="newPassword" name="newPassword" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirm New Password</label>
          <input type="password" id="confirmPassword" name="confirmPassword" class="form-control" required>
        </div>
      </form>
    `;
    
    window.app.createModal('Change Password', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Update Password',
        class: 'btn',
        handler: () => updatePassword()
      }
    ]);
  }
  
  async function updatePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      window.app.showToast('Passwords do not match', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      window.app.showToast('Password must be at least 6 characters long', 'error');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/members/updatepassword', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update password');
      }
      
      const data = await response.json();
      
      // Update token in localStorage
      localStorage.setItem('authToken', data.token);
      
      // Close modal
      window.app.closeModal();
      
      // Show success message
      window.app.showToast('Password updated successfully', 'success');
    } catch (error) {
      console.error('Error updating password:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  function showAddShareCapitalModal() {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <form id="addShareCapitalForm">
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
    
    window.app.createModal('Add Share Capital', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Submit',
        class: 'btn',
        handler: () => addShareCapital()
      }
    ]);
  }
  
  async function addShareCapital() {
    const amount = document.getElementById('amount').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const transactionReference = document.getElementById('transactionReference').value;
    
    try {
      const response = await fetch('http://localhost:5000/api/members/sharecapital', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          amount,
          paymentMethod,
          transactionReference
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add share capital');
      }
      
      // Close modal
      window.app.closeModal();
      
      // Reload profile data
      loadMemberProfile();
      
      // Show success message
      window.app.showToast('Share capital added successfully', 'success');
    } catch (error) {
      console.error('Error adding share capital:', error);
      window.app.showToast(error.message, 'error');
    }
  }