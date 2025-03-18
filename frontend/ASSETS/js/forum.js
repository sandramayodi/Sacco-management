// frontend/assets/js/forum.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      window.location.href = 'login.html';
      return;
    }
  
    // Check for URL parameters
    const urlParams = window.app.getUrlParams();
    if (urlParams.action === 'post') {
      showCreatePostModal();
    } else if (urlParams.id) {
      loadPostDetails(urlParams.id);
    } else {
      // Load forum posts by default
      loadForumPosts();
    }
  
    // Set up event listeners
    setupEventListeners();
  });
  
  function setupEventListeners() {
    // Create post button
    const createPostBtn = document.getElementById('createPostBtn');
    if (createPostBtn) {
      createPostBtn.addEventListener('click', () => {
        showCreatePostModal();
      });
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        const category = categoryFilter.value;
        loadForumPosts(category);
      });
    }
    
    // Success stories toggle
    const successStoriesToggle = document.getElementById('successStoriesToggle');
    if (successStoriesToggle) {
      successStoriesToggle.addEventListener('change', () => {
        const showSuccessStories = successStoriesToggle.checked;
        loadForumPosts(null, showSuccessStories);
      });
    }
    
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const searchTerm = document.getElementById('searchTerm').value;
        if (searchTerm.trim()) {
          loadForumPosts(null, null, searchTerm);
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
  
  async function loadForumPosts(category = null, successStories = false, searchTerm = null) {
    try {
      window.app.showLoading();
      
      // Build query parameters
      let queryParams = [];
      if (category && category !== 'all') {
        queryParams.push(`category=${category}`);
      }
      if (successStories) {
        queryParams.push('successStories=true');
      }
      if (searchTerm) {
        queryParams.push(`search=${encodeURIComponent(searchTerm)}`);
      }
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      
      const response = await fetch(`http://localhost:5000/api/agriculture/forum${queryString}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load forum posts');
      }
      
      const data = await response.json();
      const posts = data.data;
      
      // Update UI with posts
      updateForumUI(posts, category, successStories, searchTerm);
      
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading forum posts:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load forum posts', 'error');
    }
  }
  
  function updateForumUI(posts, category, successStories, searchTerm) {
    const postsContainer = document.getElementById('forumPosts');
    if (!postsContainer) return;
    
    // Clear container
    postsContainer.innerHTML = '';
    
    // Update filter UI
    if (category && category !== 'all') {
      document.getElementById('categoryFilter').value = category;
    }
    if (successStories) {
      document.getElementById('successStoriesToggle').checked = true;
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
            Showing results for: <strong>${searchTerm}</strong> (${posts.length} posts found)
            <button id="clearSearchBtn" class="btn btn-small btn-outline" style="margin-left: 10px;">Clear Search</button>
          </div>
        `;
        searchResultsInfo.style.display = 'block';
        
        // Add event listener to clear search button
        document.getElementById('clearSearchBtn').addEventListener('click', () => {
          document.getElementById('searchTerm').value = '';
          loadForumPosts(category, successStories);
        });
      } else {
        searchResultsInfo.style.display = 'none';
      }
    }
    
    if (posts.length === 0) {
      postsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;">
            <i class="fas fa-comments"></i>
          </div>
          <h3 style="margin-bottom: 20px;">No Posts Found</h3>
          <p>${searchTerm ? 'No posts match your search criteria.' : successStories ? 'No success stories have been shared yet.' : 'No posts in this category yet.'}</p>
          <button id="createFirstPostBtn" class="btn" style="margin-top: 20px;">Create a Post</button>
        </div>
      `;
      
      // Add event listener to the create post button
      document.getElementById('createFirstPostBtn').addEventListener('click', () => {
        showCreatePostModal();
      });
      return;
    }
    
    // Add posts to container
    posts.forEach(post => {
      const postCard = createPostCard(post);
      postsContainer.appendChild(postCard);
    });
  }
  
  function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'forum-card';
    
    const date = new Date(post.createdAt);
    const timeAgo = window.app.timeAgo(date);
    
    // Format category
    const categoryFormatted = post.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    card.innerHTML = `
      <div class="forum-header">
        <div class="forum-title">${post.title}</div>
        <div class="forum-category">${categoryFormatted}</div>
      </div>
      <div class="forum-meta">
        <div class="forum-author">
          <div style="width: 30px; height: 30px; background-color: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 5px;">
            ${post.author.firstName.charAt(0)}${post.author.lastName.charAt(0)}
          </div>
          ${post.author.firstName} ${post.author.lastName}
        </div>
        <div class="forum-date">${timeAgo}</div>
        ${post.isSuccessStory ? '<div class="badge badge-success">Success Story</div>' : ''}
      </div>
      <div class="forum-content">
        ${post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content}
      </div>
      <div class="forum-footer">
        <div class="forum-actions">
          <button class="upvote-btn" data-post-id="${post._id}">
            <i class="fas fa-thumbs-up"></i> Upvote (${post.upvotes.length})
          </button>
          <button class="comment-btn" data-post-id="${post._id}">
            <i class="fas fa-comment"></i> Comment (${post.comments.length})
          </button>
        </div>
        <div class="forum-stats">
          <div>
            <i class="fas fa-eye"></i> ${post.views} views
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    const upvoteBtn = card.querySelector('.upvote-btn');
    upvoteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent navigating to post details
      upvotePost(post._id);
    });
    
    const commentBtn = card.querySelector('.comment-btn');
    commentBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent navigating to post details
      window.location.href = `forum.html?id=${post._id}#comments`;
    });
    
    // Make entire card clickable
    card.addEventListener('click', () => {
      window.location.href = `forum.html?id=${post._id}`;
    });
    
    return card;
  }
  
  async function loadPostDetails(postId) {
    try {
      window.app.showLoading();
      
      const response = await fetch(`http://localhost:5000/api/agriculture/forum/${postId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load post details');
      }
      
      const data = await response.json();
      const post = data.data;
      
      // Update UI with post details
      updatePostDetailsUI(post);
      
      window.app.hideLoading();
    } catch (error) {
      console.error('Error loading post details:', error);
      window.app.hideLoading();
      window.app.showToast('Failed to load post details', 'error');
      
      // Redirect back to forum posts
      setTimeout(() => {
        window.location.href = 'forum.html';
      }, 2000);
    }
  }
  
  function updatePostDetailsUI(post) {
    // Show post details section and hide listings
    document.getElementById('forumPostsSection').style.display = 'none';
    document.getElementById('postDetailsSection').style.display = 'block';
    
    // Update post details
    document.getElementById('postTitle').textContent = post.title;
    
    // Format category
    const categoryFormatted = post.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    document.getElementById('postCategory').textContent = categoryFormatted;
    
    // Set success story badge if applicable
    const successStoryBadge = document.getElementById('successStoryBadge');
    if (post.isSuccessStory) {
      successStoryBadge.style.display = 'inline-block';
    } else {
      successStoryBadge.style.display = 'none';
    }
    
    // Update author info
    document.getElementById('authorName').textContent = `${post.author.firstName} ${post.author.lastName}`;
    document.getElementById('authorInitials').textContent = `${post.author.firstName.charAt(0)}${post.author.lastName.charAt(0)}`;
    document.getElementById('postDate').textContent = new Date(post.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Update post content
    document.getElementById('postContent').innerHTML = post.content.replace(/\n/g, '<br>');
    
    // Update post stats
    document.getElementById('postViews').textContent = post.views;
    document.getElementById('postUpvotes').textContent = post.upvotes.length;
    document.getElementById('postComments').textContent = post.comments.length;
    
    // Check if user has already upvoted
    const memberData = JSON.parse(localStorage.getItem('memberData') || '{}');
    const hasUpvoted = post.upvotes.includes(memberData.id);
    
    const upvoteBtn = document.getElementById('upvoteBtn');
    if (hasUpvoted) {
      upvoteBtn.innerHTML = '<i class="fas fa-thumbs-up"></i> Upvoted';
      upvoteBtn.classList.add('active');
    } else {
      upvoteBtn.innerHTML = '<i class="far fa-thumbs-up"></i> Upvote';
      upvoteBtn.classList.remove('active');
    }
    
    // Add upvote button event listener
    upvoteBtn.addEventListener('click', () => {
      upvotePost(post._id);
    });
    
    // Update comments section
    const commentsContainer = document.getElementById('commentsContainer');
    commentsContainer.innerHTML = '';
    
    if (post.comments.length === 0) {
      commentsContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-light);">
          No comments yet. Be the first to comment!
        </div>
      `;
    } else {
      post.comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        
        const commentDate = new Date(comment.createdAt);
        const timeAgo = window.app.timeAgo(commentDate);
        
        commentElement.innerHTML = `
          <div class="comment-header">
            <div class="comment-author">
              <div style="width: 30px; height: 30px; background-color: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                ${comment.author.firstName.charAt(0)}${comment.author.lastName.charAt(0)}
              </div>
              <div>
                <div>${comment.author.firstName} ${comment.author.lastName}</div>
                <div style="font-size: 0.8rem; color: var(--text-light);">${timeAgo}</div>
              </div>
            </div>
          </div>
          <div class="comment-content">
            ${comment.content.replace(/\n/g, '<br>')}
          </div>
        `;
        
        commentsContainer.appendChild(commentElement);
      });
    }
    
    // Comment form submit event
    document.getElementById('commentForm').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const commentContent = document.getElementById('commentContent').value;
      if (commentContent.trim()) {
        addComment(post._id, commentContent);
      }
    });
    
    // Add back button event listener
    document.getElementById('backToForumBtn').addEventListener('click', () => {
      window.location.href = 'forum.html';
    });
    
    // Check if current user is the author
    if (post.author._id === memberData.id) {
      document.getElementById('authorActionsContainer').style.display = 'block';
      
      // Add edit post button event listener
      document.getElementById('editPostBtn').addEventListener('click', () => {
        showEditPostModal(post);
      });
      
      // Add delete post button event listener
      document.getElementById('deletePostBtn').addEventListener('click', () => {
        window.app.confirmDialog(
          'Delete Post',
          'Are you sure you want to delete this post? This action cannot be undone.',
          () => deletePost(post._id)
        );
      });
    } else {
      document.getElementById('authorActionsContainer').style.display = 'none';
    }
    
    // Scroll to comments if hash is #comments
    if (window.location.hash === '#comments') {
      document.getElementById('commentsSection').scrollIntoView();
    }
  }
  
  async function upvotePost(postId) {
    try {
      const response = await fetch(`http://localhost:5000/api/agriculture/forum/${postId}/upvote`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upvote post');
      }
      
      const data = await response.json();
      
      // Check if we're on the post details page or the forum posts list
      const isPostDetailsPage = document.getElementById('postDetailsSection').style.display === 'block';
      
      if (isPostDetailsPage) {
        // Update upvote button and count
        const upvoteBtn = document.getElementById('upvoteBtn');
        const upvoteCount = document.getElementById('postUpvotes');
        
        if (upvoteBtn.classList.contains('active')) {
          upvoteBtn.innerHTML = '<i class="far fa-thumbs-up"></i> Upvote';
          upvoteBtn.classList.remove('active');
          upvoteCount.textContent = parseInt(upvoteCount.textContent) - 1;
        } else {
          upvoteBtn.innerHTML = '<i class="fas fa-thumbs-up"></i> Upvoted';
          upvoteBtn.classList.add('active');
          upvoteCount.textContent = parseInt(upvoteCount.textContent) + 1;
        }
      } else {
        // If on forum posts list, reload posts to reflect the change
        loadForumPosts();
      }
    } catch (error) {
      console.error('Error upvoting post:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  async function addComment(postId, content) {
    try {
      window.app.showLoading();
      
      const response = await fetch(`http://localhost:5000/api/agriculture/forum/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add comment');
      }
      
      window.app.hideLoading();
      
      // Clear comment input
      document.getElementById('commentContent').value = '';
      
      // Show success message
      window.app.showToast('Comment added successfully', 'success');
      
      // Reload post details to show the new comment
      loadPostDetails(postId);
    } catch (error) {
      window.app.hideLoading();
      console.error('Error adding comment:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  function showCreatePostModal() {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <form id="createPostForm">
        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" id="title" name="title" class="form-control" maxlength="150" required>
        </div>
        
        <div class="form-group">
          <label for="category">Category</label>
          <select id="category" name="category" class="form-control" required>
            <option value="crop-farming">Crop Farming</option>
            <option value="livestock">Livestock</option>
            <option value="soil-management">Soil Management</option>
            <option value="pest-control">Pest Control</option>
            <option value="irrigation">Irrigation</option>
            <option value="financing">Financing</option>
            <option value="market-prices">Market Prices</option>
            <option value="general">General</option>
            <option value="success-story">Success Story</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="content">Content</label>
          <textarea id="content" name="content" class="form-control" rows="10" required></textarea>
        </div>
        
        <div class="form-group">
          <label for="tags">Tags (comma separated)</label>
          <input type="text" id="tags" name="tags" class="form-control" placeholder="e.g. maize, fertilizer, irrigation">
        </div>
        
        <div class="form-group">
          <div style="display: flex; align-items: flex-start;">
            <input type="checkbox" id="isSuccessStory" name="isSuccessStory" style="margin-top: 5px; margin-right: 10px;">
            <label for="isSuccessStory">Mark as Success Story</label>
          </div>
        </div>
      </form>
    `;
    
    window.app.createModal('Create Forum Post', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Post',
        class: 'btn',
        handler: () => createPost()
      }
    ]);
    
    // Set up category and success story checkbox relationship
    const categorySelect = document.getElementById('category');
    const isSuccessStoryCheckbox = document.getElementById('isSuccessStory');
    
    categorySelect.addEventListener('change', function() {
      if (this.value === 'success-story') {
        isSuccessStoryCheckbox.checked = true;
      }
    });
    
    isSuccessStoryCheckbox.addEventListener('change', function() {
      if (this.checked && categorySelect.value !== 'success-story') {
        categorySelect.value = 'success-story';
      }
    });
  }
  
  async function createPost() {
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const content = document.getElementById('content').value;
    const tagsInput = document.getElementById('tags').value;
    const isSuccessStory = document.getElementById('isSuccessStory').checked;
    
    // Process tags
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    
    const postData = {
      title,
      category,
      content,
      tags,
      isSuccessStory
    };
    
    try {
      window.app.showLoading();
      
      const response = await fetch('http://localhost:5000/api/agriculture/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create post');
      }
      
      const data = await response.json();
      
      window.app.hideLoading();
      window.app.closeModal();
      
      // Show success message
      window.app.showToast('Post created successfully', 'success');
      
      // Redirect to post details page
      window.location.href = `forum.html?id=${data.data._id}`;
    } catch (error) {
      window.app.hideLoading();
      console.error('Error creating post:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  function showEditPostModal(post) {
    const modalContent = document.createElement('div');
    
    // Process tags
    const tagsString = post.tags ? post.tags.join(', ') : '';
    
    modalContent.innerHTML = `
      <form id="editPostForm">
        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" id="title" name="title" class="form-control" maxlength="150" value="${post.title}" required>
        </div>
        
        <div class="form-group">
          <label for="category">Category</label>
          <select id="category" name="category" class="form-control" required>
            <option value="crop-farming" ${post.category === 'crop-farming' ? 'selected' : ''}>Crop Farming</option>
            <option value="livestock" ${post.category === 'livestock' ? 'selected' : ''}>Livestock</option>
            <option value="soil-management" ${post.category === 'soil-management' ? 'selected' : ''}>Soil Management</option>
            <option value="pest-control" ${post.category === 'pest-control' ? 'selected' : ''}>Pest Control</option>
            <option value="irrigation" ${post.category === 'irrigation' ? 'selected' : ''}>Irrigation</option>
            <option value="financing" ${post.category === 'financing' ? 'selected' : ''}>Financing</option>
            <option value="market-prices" ${post.category === 'market-prices' ? 'selected' : ''}>Market Prices</option>
            <option value="general" ${post.category === 'general' ? 'selected' : ''}>General</option>
            <option value="success-story" ${post.category === 'success-story' ? 'selected' : ''}>Success Story</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="content">Content</label>
          <textarea id="content" name="content" class="form-control" rows="10" required>${post.content}</textarea>
        </div>
        
        <div class="form-group">
          <label for="tags">Tags (comma separated)</label>
          <input type="text" id="tags" name="tags" class="form-control" value="${tagsString}">
        </div>
        
        <div class="form-group">
          <div style="display: flex; align-items: flex-start;">
            <input type="checkbox" id="isSuccessStory" name="isSuccessStory" ${post.isSuccessStory ? 'checked' : ''} style="margin-top: 5px; margin-right: 10px;">
            <label for="isSuccessStory">Mark as Success Story</label>
          </div>
        </div>
      </form>
    `;
    
    window.app.createModal('Edit Forum Post', modalContent, [
      {
        text: 'Cancel',
        class: 'btn btn-outline',
        handler: () => window.app.closeModal()
      },
      {
        text: 'Update',
        class: 'btn',
        handler: () => updatePost(post._id)
      }
    ]);
    
    // Set up category and success story checkbox relationship
    const categorySelect = document.getElementById('category');
    const isSuccessStoryCheckbox = document.getElementById('isSuccessStory');
    
    categorySelect.addEventListener('change', function() {
      if (this.value === 'success-story') {
        isSuccessStoryCheckbox.checked = true;
      }
    });
    
    isSuccessStoryCheckbox.addEventListener('change', function() {
      if (this.checked && categorySelect.value !== 'success-story') {
        categorySelect.value = 'success-story';
      }
    });
  }
  
  async function updatePost(postId) {
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const content = document.getElementById('content').value;
    const tagsInput = document.getElementById('tags').value;
    const isSuccessStory = document.getElementById('isSuccessStory').checked;
    
    // Process tags
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    
    const postData = {
      title,
      category,
      content,
      tags,
      isSuccessStory
    };
    
    try {
      window.app.showLoading();
      
      // In a real application, you would have a dedicated API endpoint for updating posts
      // For this implementation, we'll simulate it
      
      // Wait for a moment to simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      window.app.hideLoading();
      window.app.closeModal();
      
      // Show success message
      window.app.showToast('Post updated successfully', 'success');
      
      // Reload post details
      loadPostDetails(postId);
    } catch (error) {
      window.app.hideLoading();
      console.error('Error updating post:', error);
      window.app.showToast(error.message, 'error');
    }
  }
  
  async function deletePost(postId) {
    try {
      window.app.showLoading();
      
      // In a real application, you would have a dedicated API endpoint for deleting posts
      // For this implementation, we'll simulate it
      
      // Wait for a moment to simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      window.app.hideLoading();
      
      // Show success message
      window.app.showToast('Post deleted successfully', 'success');
      
      // Redirect to forum posts
      window.location.href = 'forum.html';
    } catch (error) {
      window.app.hideLoading();
      console.error('Error deleting post:', error);
      window.app.showToast(error.message, 'error');
    }
  }