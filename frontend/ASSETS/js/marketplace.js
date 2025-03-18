// frontend/assets/js/marketplace.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      window.location.href = 'login.html';
      return;
    }
  
    // Check for URL parameters
    const urlParams = window.app.getUrlParams();
    if (urlParams.action === 'create') {
      showCreateListingModal();
    } else if (urlParams.id) {
      loadProductDetails(urlParams.id);
    } else {
      // Load marketplace listings by default
      loadMarketplaceListings();
    }
  
    // Set up event listeners
    setupEventListeners();
  });
  
  function setupEventListeners() {
    // Create listing button
    const createListingBtn = document.getElementById('createListingBtn');
    if (createListingBtn) {
      createListingBtn.addEventListener('click', () => {
        showCreateListingModal();
      });
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        const category = categoryFilter.value;
        loadMarketplaceListings(category);
      });
    }
    
    // My listings toggle
    const myListingsToggle = document.getElementById('myListingsToggle');
    if (myListingsToggle) {
      myListingsToggle.addEventListener('change', () => {
        const showMyListings = myListingsToggle.checked;
        loadMarketplaceListings(null, showMyListings);
      });
    }
    
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const searchTerm = document.getElementById('searchTerm').value;
        if (searchTerm.trim()) {
          loadMarketplaceListings(null, null, searchTerm);
        }
      });
      
      // Also trigger search on Enter key
      document.getElementById('searchTerm').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          searchBtn.click();
        }
      });
    }
  }
  
  async function loadMarketplaceListings(category = null, myListings = false, searchTerm = null) {
    try {
      window.app.showLoading();
      
      // Build query parameters
      let queryParams = [];
      if (category && category !== 'all') {
        queryParams.push(`category=${category}`);
      }
      if (myListings) {
        queryParams.push('myListings=true');
      }
      if (searchTerm) {
        queryParams.push(`search=${encodeURIComponent(searchTerm)}`);
      }
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      
      const response = await fetch(`http://localhost:5000/api/agriculture/marketplace${queryString}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load marketplace listings');
      }
      
      const data = await response.json();
      const listings = data.data;
      
      // Update UI with listings
      updateMarketplaceUI(listings, category, myListings, searchTerm);
      
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading marketplace listings:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load marketplace listings', 'error');
    }
  }
  
  function updateMarketplaceUI(listings, category, myListings, searchTerm) {
    const listingsContainer = document.getElementById('marketplaceListings');
    if (!listingsContainer) return;
    
    // Clear container
    listingsContainer.innerHTML = '';
    
    // Update filter UI
    if (category && category !== 'all') {
      document.getElementById('categoryFilter').value = category;
    }
    if (myListings) {
      document.getElementById('myListingsToggle').checked = true;
    }
    if (searchTerm) {
      document.getElementById('searchTerm').value = searchTerm;
    }
    
    // Show search results info if searching
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    if (searchResultsInfo) {
      if (searchTerm) {
        searchResultsInfo.innerHTML = `
          <div class="alert alert-info">
            Showing results for: <strong>${searchTerm}</strong> (${listings.length} items found)
            <button id="clearSearchBtn" class="btn btn-small btn-outline" style="margin-left: 10px;">Clear Search</button>
          </div>
        `;
        searchResultsInfo.style.display = 'block';
        
        // Add event listener to clear search button
        document.getElementById('clearSearchBtn').addEventListener('click', () => {
          document.getElementById('searchTerm').value = '';
          loadMarketplaceListings(category, myListings);
        });
      } else {
        searchResultsInfo.style.display = 'none';
      }
    }
    
    if (listings.length === 0) {
      listingsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;">
            <i class="fas fa-store"></i>
          </div>
          <h3 style="margin-bottom: 20px;">No Listings Found</h3>
          <p>${searchTerm ? 'No items match your search criteria.' : myListings ? 'You don\'t have any active listings.' : 'No items are currently available in the marketplace.'}</p>
          <button id="createFirstListingBtn" class="btn" style="margin-top: 20px;">Create a Listing</button>
        </div>
      `;
      
      // Add event listener to the create listing button
      document.getElementById('createFirstListingBtn').addEventListener('click', () => {
        showCreateListingModal();
      });
      return;
    }
    
    // Create grid for listings
    const grid = document.createElement('div');
    grid.className = 'marketplace-grid';
    listingsContainer.appendChild(grid);
    
    // Add listings to grid
    listings.forEach(listing => {
      const card = createProductCard(listing);
      grid.appendChild(card);
    });
  }
  
  function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Handle default image
    let imageHtml = `
      <div style="font-size: 3rem; color: var(--primary-color);">
        <i class="fas fa-${getProductCategoryIcon(product.category)}"></i>
      </div>
    `;
    
    if (product.images && product.images.length > 0) {
      imageHtml = `<img src="${product.images[0]}" alt="${product.title}">`;
    }
    
    card.innerHTML = `
      <div class="product-img">
        ${imageHtml}
      </div>
      <div class="product-info">
        <div class="product-title">${product.title}</div>
        <div class="product-price">${window.app.formatCurrency(product.price)} <span style="font-size: 0.8rem; font-weight: normal;">per ${product.priceUnit}</span></div>
        <div class="product-seller">
          <i class="fas fa-user"></i> ${product.seller.firstName} ${product.seller.lastName}
        </div>
        <div style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 10px;">
          <i class="fas fa-map-marker-alt"></i> ${product.location}
        </div>
        <div style="font-size: 0.9rem; margin-bottom: 5px;">
          <span class="badge badge-info">${window.app.formatMarketCategory(product.category)}</span>
          <span class="badge ${product.status === 'available' ? 'badge-success' : 'badge-warning'}">${product.status}</span>
        </div>
        <div style="font-size: 0.9rem; margin-bottom: 10px;">
          Quantity: ${product.quantity} ${product.quantityUnit}
        </div>
      </div>
      <div class="product-footer">
        <a href="marketplace.html?id=${product._id}" class="btn btn-small btn-outline">View Details</a>
        <button class="btn btn-small contact-seller-btn" data-phone="${product.seller.phone}">
          <i class="fas fa-phone"></i> Contact
        </button>
      </div>
    `;
    
    // Add event listener to contact seller button
    const contactBtn = card.querySelector('.contact-seller-btn');
    contactBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent navigating to product details
      const phone = contactBtn.getAttribute('data-phone');
      showContactSellerModal(product.seller.firstName, product.seller.lastName, phone, product.title);
    });
    
    // Make entire card clickable
    card.addEventListener('click', () => {
      window.location.href = `marketplace.html?id=${product._id}`;
    });
    
    return card;
  }
  
  function getProductCategoryIcon(category) {
    switch (category) {
      case 'crops':
        return 'seedling';
      case 'livestock':
        return 'horse';
      case 'equipment':
        return 'tools';
      case 'services':
        return 'hands-helping';
      default:
        return 'box';
    }
  }
  
  async function loadProductDetails(productId) {
    try {
      window.app.showLoading();
      
      const response = await fetch(`http://localhost:5000/api/agriculture/marketplace/${productId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load product details');
      }
      
      const data = await response.json();
      const product = data.data;
      
      // Update UI with product details
      updateProductDetailsUI(product);
      
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading product details:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load product details', 'error');
      
      // Redirect back to marketplace listings
      setTimeout(() => {
        window.location.href = 'marketplace.html';
      }, 2000);
    }
  }
  
  function updateProductDetailsUI(product) {
    // Show product details section and hide listings
    document.getElementById('marketplaceListingsSection').style.display = 'none';
    document.getElementById('productDetailsSection').style.display = 'block';
    
    // Update product details
    document.getElementById('productTitle').textContent = product.title;
    document.getElementById('productCategory').textContent = window.app.formatMarketCategory(product.category);
    document.getElementById('productPrice').textContent = `${window.app.formatCurrency(product.price)} per ${product.priceUnit}`;
    document.getElementById('productQuantity').textContent = `${product.quantity} ${product.quantityUnit}`;
    document.getElementById('productLocation').textContent = product.location;
    document.getElementById('productStatus').textContent = product.status.charAt(0).toUpperCase() + product.status.slice(1);
    document.getElementById('productDescription').textContent = product.description;
    document.getElementById('sellerName').textContent = `${product.seller.firstName} ${product.seller.lastName}`;
    document.getElementById('sellerPhone').textContent = product.seller.phone;
    document.getElementById('sellerEmail').textContent = product.seller.email || 'Not provided';
    document.getElementById('availableFrom').textContent = window.app.formatDate(product.availableFrom);
    
    if (product.availableTo) {
      document.getElementById('availableTo').textContent = window.app.formatDate(product.availableTo);
    } else {
      document.getElementById('availableTo').textContent = 'Not specified';
    }
    
    // Update product images
    const productImagesContainer = document.getElementById('productImages');
    productImagesContainer.innerHTML = '';
    
    if (product.images && product.images.length > 0) {
      product.images.forEach(image => {
        const imgElement = document.createElement('div');
        imgElement.className = 'product-image';
        imgElement.innerHTML = `<img src="${image}" alt="${product.title}">`;
        productImagesContainer.appendChild(imgElement);
      });
    } else {
      // Show placeholder icon if no images
      const placeholder = document.createElement('div');
      placeholder.className = 'product-image-placeholder';
      placeholder.innerHTML = `
        <div style="font-size: 5rem; color: var(--primary-color);">
          <i class="fas fa-${getProductCategoryIcon(product.category)}"></i>
        </div>
      `;
      productImagesContainer.appendChild(placeholder);
    }
    
    // Set up contact seller button
    document.getElementById('contactSellerBtn').addEventListener('click', () => {
      showContactSellerModal(
        product.seller.firstName, 
        product.seller.lastName, 
        product.seller.phone, 
        product.title
      );
    });
    
    // Add back button event listener
    document.getElementById('backToListingsBtn').addEventListener('click', () => {
      window.location.href = 'marketplace.html';
    });
    
    // Check if current user is the seller
    const memberData = JSON.parse(localStorage.getItem('memberData') || '{}');
    if (product.seller._id === memberData.id) {
      document.getElementById('sellerActionsContainer').style.display = 'block';
      
      // Add edit listing button event listener
      document.getElementById('editListingBtn').addEventListener('click', () => {
        showEditListingModal(product);
      });
      
      // Add mark as sold button event listener
      document.getElementById('markAsSoldBtn').addEventListener('click', () => {
        window.app.confirmDialog(
          'Mark as Sold',
          'Are you sure you want to mark this item as sold? This will remove it from the active marketplace listings.',
          () => updateListingStatus(product._id, 'sold')
        );
      });
      
      // Add delete listing button event listener
      document.getElementById('deleteListingBtn').addEventListener('click', () => {
        window.app.confirmDialog(
          'Delete Listing',
          'Are you sure you want to delete this listing? This action cannot be undone.',
          () => deleteListing(product._id)
        );
      });
    } else {
      document.getElementById('sellerActionsContainer').style.display = 'none';
    }
  }
  
  function showContactSellerModal(firstName, lastName, phone, productTitle) {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 4rem; color: var(--primary-color); margin-bottom: 10px;">
          <i class="fas fa-user-circle"></i>
        </div>
        <h3>${firstName} ${lastName}</h3>
        <p style="color: var(--text-light);">Seller of "${productTitle}"</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <i class="fas fa-phone" style="width: 30px; color: var(--primary-color);"></i>
          <a href="tel:${phone}" style="color: var(--text-color);">${phone}</a>
        </div>
        <div style="display: flex; align-items: center;">
          <i class="fas fa-comment-alt" style="width: 30px; color: var(--primary-color);"></i>
          <a href="sms:${phone}" style="color: var(--text-color);">Send SMS</a>
        </div>
      </div>
      
      <div class="alert alert-info">
        <p><i class="fas fa-info-circle"></i> When contacting the seller, please mention that you found their listing on the Agri-Sacco Marketplace.</p>
      </div>
    `;
    
    window.app.createModal('Contact Seller', modalContent, [
      {
        text: 'Close',
        class: 'btn',
        handler: () => window.app.closeModal()
      }
    ]);
  }
  
  function showCreateListingModal() {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <form id="createListingForm">
        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" id="title" name="title" class="form-control" maxlength="100" required>
        </div>
        
        <div class="form-group">
          <label for="category">Category</label>
          <select id="category" name="category" class="form-control" required>
            <option value="crops">Crops</option>
            <option value="livestock">Livestock</option>
            <option value="equipment">Equipment</option>
            <option value="services">Services</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label for="price">Price (KES)</label>
            <input type="number" id="price" name="price" min="1" step="1" class="form-control" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label for="priceUnit">Price Unit</label>
            <input type="text" id="priceUnit" name="priceUnit" class="form-control" placeholder="per kg, per bag, etc." required>
          </div>
        </div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label for="quantity">Quantity</label>
            <input type="number" id="quantity" name="quantity" min="1" step="1" class="form-control" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label for="quantityUnit">Quantity Unit</label>
            <input type="text" id="quantityUnit" name="quantityUnit" class="form-control" placeholder="kg, bags, pieces, etc." required>
          </div>
        </div>
        
        <div class="form-group">
          <label for="location">Location</label>
          <input type="text" id="location" name="location" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" class="form-control" rows="4" required></textarea>
        </div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label for="availableFrom">Available From</label>
            <input type="date" id="availableFrom" name="availableFrom" class="form-control" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label for="availableTo">Available To (Optional)</label>
            <input type="date" id="availableTo" name="availableTo" class="form-control">
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
    
    window.app.createModal('Create Marketplace Listing', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Create Listing',
        class: 'btn',
        handler: () => createListing()
      }
    ]);
    
    // Set default available from date to today
    document.getElementById('availableFrom').valueAsDate = new Date();
  }
  
  async function createListing() {
    const formData = {
      title: document.getElementById('title').value,
      category: document.getElementById('category').value,
      price: document.getElementById('price').value,
      priceUnit: document.getElementById('priceUnit').value,
      quantity: document.getElementById('quantity').value,
      quantityUnit: document.getElementById('quantityUnit').value,
      location: document.getElementById('location').value,
      description: document.getElementById('description').value,
      availableFrom: document.getElementById('availableFrom').value,
      availableTo: document.getElementById('availableTo').value || null,
      images: [] // No image upload in this version
    };
    
    try {
      window.app.showLoading();
      
      const response = await fetch('http://localhost:5000/api/agriculture/marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create listing');
      }
      
      const data = await response.json();
      
      window.app.hideLoading();
      window.app.closeModal();
      
      // Show success message
      window.app.showToast('Listing created successfully', 'success');
      
      // Redirect to listing details page
      window.location.href = `marketplace.html?id=${data.data._id}`;
    } catch (error) {
      window.app.hideLoading();
      console.error('Error creating listing:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  function showEditListingModal(product) {
    const modalContent = document.createElement('div');
    
    modalContent.innerHTML = `
      <form id="editListingForm">
        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" id="title" name="title" class="form-control" maxlength="100" value="${product.title}" required>
        </div>
        
        <div class="form-group">
          <label for="category">Category</label>
          <select id="category" name="category" class="form-control" required>
            <option value="crops" ${product.category === 'crops' ? 'selected' : ''}>Crops</option>
            <option value="livestock" ${product.category === 'livestock' ? 'selected' : ''}>Livestock</option>
            <option value="equipment" ${product.category === 'equipment' ? 'selected' : ''}>Equipment</option>
            <option value="services" ${product.category === 'services' ? 'selected' : ''}>Services</option>
            <option value="other" ${product.category === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label for="price">Price (KES)</label>
            <input type="number" id="price" name="price" min="1" step="1" class="form-control" value="${product.price}" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label for="priceUnit">Price Unit</label>
            <input type="text" id="priceUnit" name="priceUnit" class="form-control" value="${product.priceUnit}" required>
          </div>
        </div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label for="quantity">Quantity</label>
            <input type="number" id="quantity" name="quantity" min="1" step="1" class="form-control" value="${product.quantity}" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label for="quantityUnit">Quantity Unit</label>
            <input type="text" id="quantityUnit" name="quantityUnit" class="form-control" value="${product.quantityUnit}" required>
          </div>
        </div>
        
        <div class="form-group">
          <label for="location">Location</label>
          <input type="text" id="location" name="location" class="form-control" value="${product.location}" required>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" class="form-control" rows="4" required>${product.description}</textarea>
        </div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label for="availableFrom">Available From</label>
            <input type="date" id="availableFrom" name="availableFrom" class="form-control" value="${new Date(product.availableFrom).toISOString().split('T')[0]}" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label for="availableTo">Available To (Optional)</label>
            <input type="date" id="availableTo" name="availableTo" class="form-control" ${product.availableTo ? `value="${new Date(product.availableTo).toISOString().split('T')[0]}"` : ''}>
          </div>
        </div>
        
        <div class="form-group">
          <label for="status">Status</label>
          <select id="status" name="status" class="form-control" required>
            <option value="available" ${product.status === 'available' ? 'selected' : ''}>Available</option>
            <option value="reserved" ${product.status === 'reserved' ? 'selected' : ''}>Reserved</option>
            <option value="sold" ${product.status === 'sold' ? 'selected' : ''}>Sold</option>
            <option value="unavailable" ${product.status === 'unavailable' ? 'selected' : ''}>Unavailable</option>
          </select>
        </div>
      </form>
    `;
    
    window.app.createModal('Edit Marketplace Listing', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Update Listing',
        class: 'btn',
        handler: () => updateListing(product._id)
      }
    ]);
  }
  
  async function updateListing(productId) {
    const formData = {
      title: document.getElementById('title').value,
      category: document.getElementById('category').value,
      price: document.getElementById('price').value,
      priceUnit: document.getElementById('priceUnit').value,
      quantity: document.getElementById('quantity').value,
      quantityUnit: document.getElementById('quantityUnit').value,
      location: document.getElementById('location').value,
      description: document.getElementById('description').value,
      availableFrom: document.getElementById('availableFrom').value,
      availableTo: document.getElementById('availableTo').value || null,
      status: document.getElementById('status').value
    };
    
    try {
      window.app.showLoading();
      
      const response = await fetch(`http://localhost:5000/api/agriculture/marketplace/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update listing');
      }
      
      window.app.hideLoading();
      window.app.closeModal();
      
      // Show success message
      window.app.showToast('Listing updated successfully', 'success');
      
      // Reload product details
      loadProductDetails(productId);
    } catch (error) {
      window.app.hideLoading();
      console.error('Error updating listing:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  async function updateListingStatus(productId, status) {
    try {
      window.app.showLoading();
      
      const response = await fetch(`http://localhost:5000/api/agriculture/marketplace/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update listing status');
      }
      
      window.app.hideLoading();
      
      // Show success message
      window.app.showToast(`Listing marked as ${status} successfully`, 'success');
      
      // Reload product details
      loadProductDetails(productId);
    } catch (error) {
      window.app.hideLoading();
      console.error('Error updating listing status:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  async function deleteListing(productId) {
    try {
      window.app.showLoading();
      
      const response = await fetch(`http://localhost:5000/api/agriculture/marketplace/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete listing');
      }
      
      window.app.hideLoading();
      
      // Show success message
      window.app.showToast('Listing deleted successfully', 'success');
      
      // Redirect to marketplace listings
      window.location.href = 'marketplace.html';
    } catch (error) {
      window.app.hideLoading();
      console.error('Error deleting listing:', error);
      window.app.showToast(error.message, 'error');
    }
  }