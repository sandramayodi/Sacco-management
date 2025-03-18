// frontend/assets/js/resources.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      window.location.href = 'login.html';
      return;
    }
  
    // Check for URL parameters
    const urlParams = window.app.getUrlParams();
    if (urlParams.action === 'share') {
      showShareResourceModal();
    } else if (urlParams.id) {
      loadResourceDetails(urlParams.id);
    } else {
      // Load resources by default
      loadResourcesListings();
    }
  
    // Set up event listeners
    setupEventListeners();
  });
  
  function setupEventListeners() {
    // Share resource button
    const shareResourceBtn = document.getElementById('shareResourceBtn');
    if (shareResourceBtn) {
      shareResourceBtn.addEventListener('click', () => {
        showShareResourceModal();
      });
    }
    
    // Resource type filter
    const resourceTypeFilter = document.getElementById('resourceTypeFilter');
    if (resourceTypeFilter) {
      resourceTypeFilter.addEventListener('change', () => {
        const resourceType = resourceTypeFilter.value;
        loadResourcesListings(resourceType);
      });
    }
    
    // Sharing basis filter
    const sharingBasisFilter = document.getElementById('sharingBasisFilter');
    if (sharingBasisFilter) {
      sharingBasisFilter.addEventListener('change', () => {
        const sharingBasis = sharingBasisFilter.value;
        loadResourcesListings(null, sharingBasis);
      });
    }
    
    // My resources toggle
    const myResourcesToggle = document.getElementById('myResourcesToggle');
    if (myResourcesToggle) {
      myResourcesToggle.addEventListener('change', () => {
        const showMyResources = myResourcesToggle.checked;
        loadResourcesListings(null, null, showMyResources);
      });
    }
  }
  
  async function loadResourcesListings(resourceType = null, sharingBasis = null, myResources = false) {
    try {
      window.app.showLoading();
      
      // Build query parameters
      let queryParams = [];
      if (resourceType && resourceType !== 'all') {
        queryParams.push(`resourceType=${resourceType}`);
      }
      if (sharingBasis && sharingBasis !== 'all') {
        queryParams.push(`sharingBasis=${sharingBasis}`);
      }
      if (myResources) {
        queryParams.push('myResources=true');
      }
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      
      const response = await fetch(`http://localhost:5000/api/agriculture/resources${queryString}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load resources');
      }
      
      const data = await response.json();
      const resources = data.data;
      
      // Update UI with resources
      updateResourcesUI(resources, resourceType, sharingBasis, myResources);
      
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading resources:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load resources', 'error');
    }
  }
  
  function updateResourcesUI(resources, resourceType, sharingBasis, myResources) {
    const resourcesContainer = document.getElementById('resourcesContainer');
    if (!resourcesContainer) return;
    
    // Clear container
    resourcesContainer.innerHTML = '';
    
    // Update filter UI
    if (resourceType && resourceType !== 'all') {
      document.getElementById('resourceTypeFilter').value = resourceType;
    }
    if (sharingBasis && sharingBasis !== 'all') {
      document.getElementById('sharingBasisFilter').value = sharingBasis;
    }
    if (myResources) {
      document.getElementById('myResourcesToggle').checked = true;
    }
    
    if (resources.length === 0) {
      resourcesContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;">
            <i class="fas fa-share-alt"></i>
          </div>
          <h3 style="margin-bottom: 20px;">No Resources Found</h3>
          <p>${myResources ? 'You haven\'t shared any resources yet.' : 'No shared resources are currently available.'}</p>
          <button id="shareFirstResourceBtn" class="btn" style="margin-top: 20px;">Share a Resource</button>
        </div>
      `;
      
      // Add event listener to the share resource button
      document.getElementById('shareFirstResourceBtn').addEventListener('click', () => {
        showShareResourceModal();
      });
      return;
    }
    
    // Create grid for resources
    const grid = document.createElement('div');
    grid.className = 'resource-grid';
    resourcesContainer.appendChild(grid);
    
    // Add resources to grid
    resources.forEach(resource => {
      const card = createResourceCard(resource);
      grid.appendChild(card);
    });
  }
  
  function createResourceCard(resource) {
    const card = document.createElement('div');
    card.className = 'resource-card';
    
    // Handle default image
    let imageHtml = `
      <div style="font-size: 3rem; color: var(--primary-color);">
        <i class="fas fa-${getResourceTypeIcon(resource.resourceType)}"></i>
      </div>
    `;
    
    if (resource.images && resource.images.length > 0) {
      imageHtml = `<img src="${resource.images[0]}" alt="${resource.title}">`;
    }
    
    // Format sharing basis
    let sharingBasisHtml = '';
    if (resource.sharingBasis === 'free') {
      sharingBasisHtml = '<span class="resource-basis free">Free</span>';
    } else if (resource.sharingBasis === 'fee') {
      sharingBasisHtml = `<span class="resource-basis fee">${window.app.formatCurrency(resource.fee)} ${resource.feeUnit}</span>`;
    } else if (resource.sharingBasis === 'exchange') {
      sharingBasisHtml = '<span class="resource-basis exchange">Exchange</span>';
    } else if (resource.sharingBasis === 'communal') {
      sharingBasisHtml = '<span class="resource-basis free">Communal</span>';
    }
    
    card.innerHTML = `
      <div class="resource-img">
        ${imageHtml}
      </div>
      <div class="resource-info">
        <div class="resource-title">${resource.title}</div>
        <div class="resource-type">${window.app.formatResourceType(resource.resourceType)}</div>
        <div class="resource-location"><i class="fas fa-map-marker-alt"></i> ${resource.location}</div>
        <div class="resource-basis">${sharingBasisHtml}</div>
        <div class="resource-owner">
          <div style="width: 30px; height: 30px; background-color: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
            ${resource.owner.firstName.charAt(0)}${resource.owner.lastName.charAt(0)}
          </div>
          <span>${resource.owner.firstName} ${resource.owner.lastName}</span>
        </div>
      </div>
      <div class="resource-footer">
        <a href="resources.html?id=${resource._id}" class="btn btn-small btn-outline">View Details</a>
        <button class="btn btn-small book-resource-btn">
          <i class="fas fa-calendar-check"></i> Book
        </button>
      </div>
    `;
    
    // Add event listener to book resource button
    const bookBtn = card.querySelector('.book-resource-btn');
    bookBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent navigating to resource details
      showBookResourceModal(resource._id, resource.title, resource.resourceType);
    });
    
    // Make entire card clickable
    card.addEventListener('click', () => {
      window.location.href = `resources.html?id=${resource._id}`;
    });
    
    return card;
  }
  
  function getResourceTypeIcon(resourceType) {
    switch (resourceType) {
      case 'land':
        return 'map-marked-alt';
      case 'tractor':
        return 'tractor';
      case 'irrigation-equipment':
        return 'water';
      case 'processing-machine':
        return 'cogs';
      case 'storage-facility':
        return 'warehouse';
      default:
        return 'tools';
    }
  }
  
  async function loadResourceDetails(resourceId) {
    try {
      window.app.showLoading();
      
      const response = await fetch(`http://localhost:5000/api/agriculture/resources/${resourceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load resource details');
      }
      
      const data = await response.json();
      const resource = data.data;
      
      // Update UI with resource details
      updateResourceDetailsUI(resource);
      
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading resource details:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load resource details', 'error');
      
      // Redirect back to resources list
      setTimeout(() => {
        window.location.href = 'resources.html';
      }, 2000);
    }
  }
  
  function updateResourceDetailsUI(resource) {
    // Show resource details section and hide listings
    document.getElementById('resourcesListingsSection').style.display = 'none';
    document.getElementById('resourceDetailsSection').style.display = 'block';
    
    // Update resource details
    document.getElementById('resourceTitle').textContent = resource.title;
    document.getElementById('resourceType').textContent = window.app.formatResourceType(resource.resourceType);
    document.getElementById('resourceLocation').textContent = resource.location;
    
    // Update sharing basis
    if (resource.sharingBasis === 'free') {
      document.getElementById('resourceSharingBasis').textContent = 'Free';
      document.getElementById('resourceSharingBasis').className = 'resource-basis free';
    } else if (resource.sharingBasis === 'fee') {
      document.getElementById('resourceSharingBasis').textContent = `${window.app.formatCurrency(resource.fee)} ${resource.feeUnit}`;
      document.getElementById('resourceSharingBasis').className = 'resource-basis fee';
    } else if (resource.sharingBasis === 'exchange') {
      document.getElementById('resourceSharingBasis').textContent = 'Exchange';
      document.getElementById('resourceSharingBasis').className = 'resource-basis exchange';
    } else if (resource.sharingBasis === 'communal') {
      document.getElementById('resourceSharingBasis').textContent = 'Communal';
      document.getElementById('resourceSharingBasis').className = 'resource-basis free';
    }
    
    document.getElementById('resourceDescription').textContent = resource.description;
    document.getElementById('ownerName').textContent = `${resource.owner.firstName} ${resource.owner.lastName}`;
    document.getElementById('ownerPhone').textContent = resource.owner.phone;
    document.getElementById('ownerEmail').textContent = resource.owner.email || 'Not provided';
    
    // Update resource images
    const resourceImagesContainer = document.getElementById('resourceImages');
    resourceImagesContainer.innerHTML = '';
    
    if (resource.images && resource.images.length > 0) {
      resource.images.forEach(image => {
        const imgElement = document.createElement('div');
        imgElement.className = 'resource-image';
        imgElement.innerHTML = `<img src="${image}" alt="${resource.title}">`;
        resourceImagesContainer.appendChild(imgElement);
      });
    } else {
      // Show placeholder icon if no images
      const placeholder = document.createElement('div');
      placeholder.className = 'resource-image-placeholder';
      placeholder.innerHTML = `
        <div style="font-size: 5rem; color: var(--primary-color);">
          <i class="fas fa-${getResourceTypeIcon(resource.resourceType)}"></i>
        </div>
      `;
      resourceImagesContainer.appendChild(placeholder);
    }
    
    // Update availability schedule
    const availabilityContainer = document.getElementById('availabilitySchedule');
    availabilityContainer.innerHTML = '';
    
    if (resource.availabilitySchedule && resource.availabilitySchedule.length > 0) {
      const availabilityTable = document.createElement('table');
      availabilityTable.className = 'table';
      availabilityTable.innerHTML = `
        <thead>
          <tr>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="availabilityTableBody"></tbody>
      `;
      
      availabilityContainer.appendChild(availabilityTable);
      
      const tableBody = document.getElementById('availabilityTableBody');
      
      // Sort availability by start date
      const sortedSchedule = [...resource.availabilitySchedule].sort((a, b) => 
        new Date(a.startDate) - new Date(b.startDate)
      );
      
      sortedSchedule.forEach(slot => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>${window.app.formatDate(slot.startDate)}</td>
          <td>${window.app.formatDate(slot.endDate)}</td>
          <td>
            <span class="badge ${slot.status === 'available' ? 'badge-success' : 'badge-warning'}">
              ${slot.status === 'available' ? 'Available' : 'Booked'}
            </span>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
    } else {
      availabilityContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-light);">
          No availability schedule has been set up yet.
        </div>
      `;
    }
    
    // Set up book resource button
    document.getElementById('bookResourceBtn').addEventListener('click', () => {
      showBookResourceModal(resource._id, resource.title, resource.resourceType);
    });
    
    // Add back button event listener
    document.getElementById('backToResourcesBtn').addEventListener('click', () => {
      window.location.href = 'resources.html';
    });
    
    // Check if current user is the owner
    const memberData = JSON.parse(localStorage.getItem('memberData') || '{}');
    if (resource.owner._id === memberData.id) {
      document.getElementById('ownerActionsContainer').style.display = 'block';
      
      // Add edit resource button event listener
      document.getElementById('editResourceBtn').addEventListener('click', () => {
        showEditResourceModal(resource);
      });
      
      // Add manage availability button event listener
      document.getElementById('manageAvailabilityBtn').addEventListener('click', () => {
        showManageAvailabilityModal(resource);
      });
      
      // Add delete resource button event listener
      document.getElementById('deleteResourceBtn').addEventListener('click', () => {
        window.app.confirmDialog(
          'Delete Resource',
          'Are you sure you want to delete this resource? This action cannot be undone.',
          () => deleteResource(resource._id)
        );
      });
    } else {
      document.getElementById('ownerActionsContainer').style.display = 'none';
    }
  }
  
  function showBookResourceModal(resourceId, resourceTitle, resourceType) {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <form id="bookResourceForm">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 10px;">
            <i class="fas fa-${getResourceTypeIcon(resourceType)}"></i>
          </div>
          <h3>${resourceTitle}</h3>
        </div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label for="startDate">Start Date</label>
            <input type="date" id="startDate" name="startDate" class="form-control" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label for="endDate">End Date</label>
            <input type="date" id="endDate" name="endDate" class="form-control" required>
          </div>
        </div>
        
        <div class="form-group">
          <label for="purpose">Purpose (Optional)</label>
          <textarea id="purpose" name="purpose" class="form-control" rows="3"></textarea>
        </div>
        
        <div class="alert alert-info">
          <p><i class="fas fa-info-circle"></i> Booking this resource will reserve it for your use during the selected period. The resource owner will be notified of your booking request.</p>
        </div>
      </form>
    `;
    
    window.app.createModal('Book Resource', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Book',
        class: 'btn',
        handler: () => bookResource(resourceId)
      }
    ]);
    
    // Set minimum start date to today
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    document.getElementById('startDate').min = today.toISOString().split('T')[0];
    document.getElementById('startDate').valueAsDate = today;
    
    document.getElementById('endDate').min = tomorrow.toISOString().split('T')[0];
    document.getElementById('endDate').valueAsDate = tomorrow;
    
    // Add validation for date range
    document.getElementById('startDate').addEventListener('change', validateDateRange);
    document.getElementById('endDate').addEventListener('change', validateDateRange);
  }
  
  function validateDateRange() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    if (startDate >= endDate) {
      document.getElementById('endDate').setCustomValidity('End date must be after start date');
    } else {
      document.getElementById('endDate').setCustomValidity('');
    }
  }
  
  async function bookResource(resourceId) {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    try {
      window.app.showLoading();
      
      const response = await fetch(`http://localhost:5000/api/agriculture/resources/${resourceId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          startDate,
          endDate
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to book resource');
      }
      
      window.app.hideLoading();
      window.app.closeModal();
      
      // Show success message
      window.app.showToast('Resource booked successfully', 'success');
      
      // Reload resource details
      loadResourceDetails(resourceId);
    } catch (error) {
      window.app.hideLoading();
      console.error('Error booking resource:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  function showShareResourceModal() {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <form id="shareResourceForm">
        <div class="form-group">
          <label for="resourceType">Resource Type</label>
          <select id="resourceType" name="resourceType" class="form-control" required>
            <option value="land">Land</option>
            <option value="tractor">Tractor</option>
            <option value="irrigation-equipment">Irrigation Equipment</option>
            <option value="processing-machine">Processing Machine</option>
            <option value="storage-facility">Storage Facility</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" id="title" name="title" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" class="form-control" rows="3" required></textarea>
        </div>
        
        <div class="form-group">
          <label for="location">Location</label>
          <input type="text" id="location" name="location" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="sharingBasis">Sharing Basis</label>
          <select id="sharingBasis" name="sharingBasis" class="form-control" required>
            <option value="free">Free</option>
            <option value="fee">Fee</option>
            <option value="exchange">Exchange</option>
            <option value="communal">Communal</option>
          </select>
        </div>
        
        <div id="feeContainer" style="display: none;">
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="fee">Fee Amount (KES)</label>
              <input type="number" id="fee" name="fee" min="1" step="1" class="form-control">
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="feeUnit">Fee Unit</label>
              <input type="text" id="feeUnit" name="feeUnit" class="form-control" placeholder="per day, per hectare, etc.">
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>Availability Schedule</label>
          <div id="availabilitySchedule">
            <div class="availability-slot" style="border: 1px solid var(--border-color); padding: 15px; margin-bottom: 10px; border-radius: 4px;">
              <div style="display: flex; gap: 20px; margin-bottom: 10px;">
                <div class="form-group" style="flex: 1; margin-bottom: 0;">
                  <label for="slotStartDate">Start Date</label>
                  <input type="date" id="slotStartDate" name="slotStartDate" class="form-control" required>
                </div>
                <div class="form-group" style="flex: 1; margin-bottom: 0;">
                  <label for="slotEndDate">End Date</label>
                  <input type="date" id="slotEndDate" name="slotEndDate" class="form-control" required>
                </div>
              </div>
            </div>
            <button type="button" id="addSlotBtn" class="btn btn-small btn-outline">
              <i class="fas fa-plus"></i> Add Another Availability Slot
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label>Upload Images (Coming Soon)</label>
          <div style="border: 2px dashed var(--border-color); padding: 20px; text-align: center; color: var(--text-light);">
            Image upload functionality will be available in the next update
          </div>
        </div>
      </form>
    `;
    
    window.app.createModal('Share Resource', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Share',
        class: 'btn',
        handler: () => shareResource()
      }
    ]);
    
    // Set up sharing basis change event
    document.getElementById('sharingBasis').addEventListener('change', function() {
      const feeContainer = document.getElementById('feeContainer');
      if (this.value === 'fee') {
        feeContainer.style.display = 'block';
        document.getElementById('fee').setAttribute('required', 'required');
        document.getElementById('feeUnit').setAttribute('required', 'required');
      } else {
        feeContainer.style.display = 'none';
        document.getElementById('fee').removeAttribute('required');
        document.getElementById('feeUnit').removeAttribute('required');
      }
    });
    
    // Set up add slot button
    document.getElementById('addSlotBtn').addEventListener('click', function() {
      const slotContainer = document.createElement('div');
      slotContainer.className = 'availability-slot';
      slotContainer.style.border = '1px solid var(--border-color)';
      slotContainer.style.padding = '15px';
      slotContainer.style.marginBottom = '10px';
      slotContainer.style.borderRadius = '4px';
      
      const slotId = window.app.generateTempId();
      
      slotContainer.innerHTML = `
        <div style="display: flex; gap: 20px; margin-bottom: 10px;">
          <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <label for="slotStartDate_${slotId}">Start Date</label>
            <input type="date" id="slotStartDate_${slotId}" name="slotStartDate_${slotId}" class="slot-start-date form-control" required>
          </div>
          <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <label for="slotEndDate_${slotId}">End Date</label>
            <input type="date" id="slotEndDate_${slotId}" name="slotEndDate_${slotId}" class="slot-end-date form-control" required>
          </div>
        </div>
        <button type="button" class="btn btn-small btn-outline remove-slot-btn">
          <i class="fas fa-trash"></i> Remove
        </button>
      `;
      
      // Add remove slot button event listener
      slotContainer.querySelector('.remove-slot-btn').addEventListener('click', function() {
        slotContainer.remove();
      });
      
      // Insert before the add button
      document.getElementById('addSlotBtn').parentNode.insertBefore(slotContainer, document.getElementById('addSlotBtn'));
      
      // Set minimum dates
      const today = new Date();
      document.getElementById(`slotStartDate_${slotId}`).min = today.toISOString().split('T')[0];
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById(`slotEndDate_${slotId}`).min = tomorrow.toISOString().split('T')[0];
    });
    
    // Set minimum dates for initial slot
    const today = new Date();
    document.getElementById('slotStartDate').min = today.toISOString().split('T')[0];
    document.getElementById('slotStartDate').valueAsDate = today;
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('slotEndDate').min = tomorrow.toISOString().split('T')[0];
    document.getElementById('slotEndDate').valueAsDate = tomorrow;
  }
  
  async function shareResource() {
    // Get form data
    const resourceType = document.getElementById('resourceType').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const location = document.getElementById('location').value;
    const sharingBasis = document.getElementById('sharingBasis').value;
    
    // Get fee if applicable
    let fee, feeUnit;
    if (sharingBasis === 'fee') {
      fee = document.getElementById('fee').value;
      feeUnit = document.getElementById('feeUnit').value;
    }
    
    // Get availability schedule
    const availabilitySchedule = [];
    
    // Get initial slot
    const initialStartDate = document.getElementById('slotStartDate').value;
    const initialEndDate = document.getElementById('slotEndDate').value;
    
    if (initialStartDate && initialEndDate) {
      availabilitySchedule.push({
        startDate: initialStartDate,
        endDate: initialEndDate,
        status: 'available'
      });
    }
    
    // Get additional slots
    const additionalSlots = document.querySelectorAll('.availability-slot:not(:first-child)');
    additionalSlots.forEach(slot => {
      const startDateInput = slot.querySelector('.slot-start-date');
      const endDateInput = slot.querySelector('.slot-end-date');
      
      if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
        availabilitySchedule.push({
          startDate: startDateInput.value,
          endDate: endDateInput.value,
          status: 'available'
        });
      }
    });
    
    // Build resource data
    const resourceData = {
      resourceType,
      title,
      description,
      location,
      sharingBasis,
      availabilitySchedule,
      images: [] // No image upload in this version
    };
    
    // Add fee if applicable
    if (sharingBasis === 'fee') {
      resourceData.fee = fee;
      resourceData.feeUnit = feeUnit;
    }
    
    try {
      window.app.showLoading();
      
      const response = await fetch('http://localhost:5000/api/agriculture/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(resourceData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to share resource');
      }
      
      const data = await response.json();
      
      window.app.hideLoading();
      window.app.closeModal();
      
      // Show success message
      window.app.showToast('Resource shared successfully', 'success');
      
      // Redirect to resource details page
      window.location.href = `resources.html?id=${data.data._id}`;
    } catch (error) {
      window.app.hideLoading();
      console.error('Error sharing resource:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  function showEditResourceModal(resource) {
    const modalContent = document.createElement('div');
    
    // Format sharing basis for dropdowns
    const sharingBasisOptions = {
      free: resource.sharingBasis === 'free' ? 'selected' : '',
      fee: resource.sharingBasis === 'fee' ? 'selected' : '',
      exchange: resource.sharingBasis === 'exchange' ? 'selected' : '',
      communal: resource.sharingBasis === 'communal' ? 'selected' : ''
    };
    
    modalContent.innerHTML = `
      <form id="editResourceForm">
        <div class="form-group">
          <label for="resourceType">Resource Type</label>
          <select id="resourceType" name="resourceType" class="form-control" required>
            <option value="land" ${resource.resourceType === 'land' ? 'selected' : ''}>Land</option>
            <option value="tractor" ${resource.resourceType === 'tractor' ? 'selected' : ''}>Tractor</option>
            <option value="irrigation-equipment" ${resource.resourceType === 'irrigation-equipment' ? 'selected' : ''}>Irrigation Equipment</option>
            <option value="processing-machine" ${resource.resourceType === 'processing-machine' ? 'selected' : ''}>Processing Machine</option>
            <option value="storage-facility" ${resource.resourceType === 'storage-facility' ? 'selected' : ''}>Storage Facility</option>
            <option value="other" ${resource.resourceType === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" id="title" name="title" class="form-control" value="${resource.title}" required>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" class="form-control" rows="3" required>${resource.description}</textarea>
        </div>
        
        <div class="form-group">
          <label for="location">Location</label>
          <input type="text" id="location" name="location" class="form-control" value="${resource.location}" required>
        </div>
        
        <div class="form-group">
          <label for="sharingBasis">Sharing Basis</label>
          <select id="sharingBasis" name="sharingBasis" class="form-control" required>
            <option value="free" ${sharingBasisOptions.free}>Free</option>
            <option value="fee" ${sharingBasisOptions.fee}>Fee</option>
            <option value="exchange" ${sharingBasisOptions.exchange}>Exchange</option>
            <option value="communal" ${sharingBasisOptions.communal}>Communal</option>
          </select>
        </div>
        
        <div id="feeContainer" style="display: ${resource.sharingBasis === 'fee' ? 'block' : 'none'};">
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="fee">Fee Amount (KES)</label>
              <input type="number" id="fee" name="fee" min="1" step="1" class="form-control" value="${resource.fee || ''}">
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="feeUnit">Fee Unit</label>
              <input type="text" id="feeUnit" name="feeUnit" class="form-control" placeholder="per day, per hectare, etc." value="${resource.feeUnit || ''}">
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="status">Status</label>
          <select id="status" name="status" class="form-control" required>
            <option value="active" ${resource.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${resource.status === 'inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      </form>
    `;
    
    window.app.createModal('Edit Resource', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Update',
        class: 'btn',
        handler: () => updateResource(resource._id)
      }
    ]);
    
    // Set up sharing basis change event
    document.getElementById('sharingBasis').addEventListener('change', function() {
      const feeContainer = document.getElementById('feeContainer');
      if (this.value === 'fee') {
        feeContainer.style.display = 'block';
        document.getElementById('fee').setAttribute('required', 'required');
        document.getElementById('feeUnit').setAttribute('required', 'required');
      } else {
        feeContainer.style.display = 'none';
        document.getElementById('fee').removeAttribute('required');
        document.getElementById('feeUnit').removeAttribute('required');
      }
    });
  }
  
  async function updateResource(resourceId) {
    // Get form data
    const resourceType = document.getElementById('resourceType').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const location = document.getElementById('location').value;
    const sharingBasis = document.getElementById('sharingBasis').value;
    const status = document.getElementById('status').value;
    
    // Get fee if applicable
    let fee, feeUnit;
    if (sharingBasis === 'fee') {
      fee = document.getElementById('fee').value;
      feeUnit = document.getElementById('feeUnit').value;
    }
    
    // Build resource data
    const resourceData = {
      resourceType,
      title,
      description,
      location,
      sharingBasis,
      status
    };
    
    // Add fee if applicable
    if (sharingBasis === 'fee') {
      resourceData.fee = fee;
      resourceData.feeUnit = feeUnit;
    }
    
    try {
      window.app.showLoading();
      
      const response = await fetch(`http://localhost:5000/api/agriculture/resources/${resourceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(resourceData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update resource');
      }
      
      window.app.hideLoading();
      window.app.closeModal();
      
      // Show success message
      window.app.showToast('Resource updated successfully', 'success');
      
      // Reload resource details
      loadResourceDetails(resourceId);
    } catch (error) {
      window.app.hideLoading();
      console.error('Error updating resource:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  function showManageAvailabilityModal(resource) {
    const modalContent = document.createElement('div');
    
    modalContent.innerHTML = `
      <div class="form-group">
        <label>Current Availability Schedule</label>
        <div id="currentAvailability">
          ${resource.availabilitySchedule && resource.availabilitySchedule.length > 0 ? 
            `<table class="table">
              <thead>
                <tr>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="availabilityTableBody"></tbody>
            </table>` :
            `<div style="text-align: center; padding: 20px; color: var(--text-light);">
              No availability schedule has been set up yet.
            </div>`
          }
        </div>
      </div>
      
      <div class="form-group">
        <label>Add New Availability</label>
        <div style="border: 1px solid var(--border-color); padding: 15px; border-radius: 4px;">
          <div style="display: flex; gap: 20px; margin-bottom: 10px;">
            <div class="form-group" style="flex: 1; margin-bottom: 0;">
              <label for="newStartDate">Start Date</label>
              <input type="date" id="newStartDate" name="newStartDate" class="form-control" required>
            </div>
            <div class="form-group" style="flex: 1; margin-bottom: 0;">
              <label for="newEndDate">End Date</label>
              <input type="date" id="newEndDate" name="newEndDate" class="form-control" required>
            </div>
          </div>
          <button type="button" id="addAvailabilityBtn" class="btn">
            <i class="fas fa-plus"></i> Add Availability
          </button>
        </div>
      </div>
    `;
    
    window.app.createModal('Manage Availability', modalContent, [
      {
        text: 'Close',
        class: 'btn',
        handler: () => {
          window.app.closeModal();
          // Reload resource details to reflect any changes
          loadResourceDetails(resource._id);
        }
      }
    ]);
    
    // Populate existing availability slots
    if (resource.availabilitySchedule && resource.availabilitySchedule.length > 0) {
      const tableBody = document.getElementById('availabilityTableBody');
      
      // Sort availability by start date
      const sortedSchedule = [...resource.availabilitySchedule].sort((a, b) => 
        new Date(a.startDate) - new Date(b.startDate)
      );
      
      sortedSchedule.forEach((slot, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>${window.app.formatDate(slot.startDate)}</td>
          <td>${window.app.formatDate(slot.endDate)}</td>
          <td>
            <span class="badge ${slot.status === 'available' ? 'badge-success' : 'badge-warning'}">
              ${slot.status === 'available' ? 'Available' : 'Booked'}
            </span>
          </td>
          <td>
            ${slot.status === 'available' ? 
              `<button type="button" class="btn btn-small btn-outline delete-slot-btn" data-index="${index}">
                <i class="fas fa-trash"></i> Remove
              </button>` :
              `<span style="color: var(--text-light);">Cannot modify booked slots</span>`
            }
          </td>
        `;
        
        tableBody.appendChild(row);
      });
      
      // Add event listeners to delete buttons
      document.querySelectorAll('.delete-slot-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = btn.getAttribute('data-index');
          deleteAvailabilitySlot(resource._id, index);
        });
      });
    }
    
    // Set minimum dates for new availability
    const today = new Date();
    document.getElementById('newStartDate').min = today.toISOString().split('T')[0];
    document.getElementById('newStartDate').valueAsDate = today;
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('newEndDate').min = tomorrow.toISOString().split('T')[0];
    document.getElementById('newEndDate').valueAsDate = tomorrow;
    
    // Add event listener for adding new availability
    document.getElementById('addAvailabilityBtn').addEventListener('click', () => {
      const startDate = document.getElementById('newStartDate').value;
      const endDate = document.getElementById('newEndDate').value;
      
      if (startDate && endDate) {
        addAvailabilitySlot(resource._id, startDate, endDate);
      } else {
        window.app.showToast('Please select start and end dates', 'warning');
      }
    });
  }
  
  async function addAvailabilitySlot(resourceId, startDate, endDate) {
    try {
      window.app.showLoading();
      
      // In a real app, you would have a dedicated API endpoint for this
      // For this implementation, we'll first get the current resource data
      const response = await fetch(`http://localhost:5000/api/agriculture/resources/${resourceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch resource');
      }
      
      const data = await response.json();
      const resource = data.data;
      
      // Add new availability slot
      const updatedSchedule = [...(resource.availabilitySchedule || []), {
        startDate,
        endDate,
        status: 'available'
      }];
      
      // Update the resource
      const updateResponse = await fetch(`http://localhost:5000/api/agriculture/resources/${resourceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          availabilitySchedule: updatedSchedule
        })
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update availability');
      }
      
      window.app.hideLoading();
      
      // Show success message
      window.app.showToast('Availability slot added successfully', 'success');
      
      // Close the modal and reopen it with updated data
      window.app.closeModal();
      
      // Refresh the resource data and show the modal again
      const refreshedResponse = await fetch(`http://localhost:5000/api/agriculture/resources/${resourceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (refreshedResponse.ok) {
        const refreshedData = await refreshedResponse.json();
        showManageAvailabilityModal(refreshedData.data);
      }
    } catch (error) {
      window.app.hideLoading();
      console.error('Error adding availability slot:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  async function deleteAvailabilitySlot(resourceId, index) {
    try {
      window.app.showLoading();
      
      // In a real app, you would have a dedicated API endpoint for this
      // For this implementation, we'll first get the current resource data
      const response = await fetch(`http://localhost:5000/api/agriculture/resources/${resourceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch resource');
      }
      
      const data = await response.json();
      const resource = data.data;
      
      // Remove the slot at the specified index
      const updatedSchedule = resource.availabilitySchedule.filter((_, i) => i != index);
      
      // Update the resource
      const updateResponse = await fetch(`http://localhost:5000/api/agriculture/resources/${resourceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          availabilitySchedule: updatedSchedule
        })
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update availability');
      }
      
      window.app.hideLoading();
      
      // Show success message
      window.app.showToast('Availability slot removed successfully', 'success');
      
      // Close the modal and reopen it with updated data
      window.app.closeModal();
      
      // Refresh the resource data and show the modal again
      const refreshedResponse = await fetch(`http://localhost:5000/api/agriculture/resources/${resourceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (refreshedResponse.ok) {
        const refreshedData = await refreshedResponse.json();
        showManageAvailabilityModal(refreshedData.data);
      }
    } catch (error) {
      window.app.hideLoading();
      console.error('Error removing availability slot:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  async function deleteResource(resourceId) {
    try {
      window.app.showLoading();
      
      const response = await fetch(`http://localhost:5000/api/agriculture/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete resource');
      }
      
      window.app.hideLoading();
      
      // Show success message
      window.app.showToast('Resource deleted successfully', 'success');
      
      // Redirect to resources list
      window.location.href = 'resources.html';
    } catch (error) {
      window.app.hideLoading();
      console.error('Error deleting resource:', error);
      window.app.showToast(error.message, 'error');
    }
  }