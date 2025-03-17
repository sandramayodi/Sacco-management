// controllers/agricultureController.js
const MarketItem = require('../models/MarketItem');
const ResourceSharing = require('../models/ResourceSharing');
const ForumPost = require('../models/ForumPost');
const Consultation = require('../models/Consultation');
const Member = require('../models/Member');

// ===== MARKETPLACE FUNCTIONS =====

// @desc    Create marketplace listing
// @route   POST /api/agriculture/marketplace
// @access  Private
exports.createMarketListing = async (req, res, next) => {
  try {
    req.body.seller = req.member.id;
    
    const marketItem = await MarketItem.create(req.body);
    
    res.status(201).json({
      success: true,
      data: marketItem
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all marketplace listings
// @route   GET /api/agriculture/marketplace
// @access  Private
exports.getMarketListings = async (req, res, next) => {
  try {
    // Build query with filters
    let query = {};
    
    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    } else {
      // Default to show only available items
      query.status = 'available';
    }
    
    // Check if only user's listings are requested
    if (req.query.myListings === 'true') {
      query.seller = req.member.id;
    }
    
    const marketItems = await MarketItem.find(query)
      .populate('seller', 'firstName lastName phone')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: marketItems.length,
      data: marketItems
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single marketplace listing
// @route   GET /api/agriculture/marketplace/:id
// @access  Private
exports.getMarketListing = async (req, res, next) => {
  try {
    const marketItem = await MarketItem.findById(req.params.id)
      .populate('seller', 'firstName lastName phone email');
    
    if (!marketItem) {
      return res.status(404).json({
        success: false,
        error: 'Marketplace listing not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: marketItem
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update marketplace listing
// @route   PUT /api/agriculture/marketplace/:id
// @access  Private
exports.updateMarketListing = async (req, res, next) => {
  try {
    let marketItem = await MarketItem.findById(req.params.id);
    
    if (!marketItem) {
      return res.status(404).json({
        success: false,
        error: 'Marketplace listing not found'
      });
    }
    
    // Make sure user is the seller
    if (marketItem.seller.toString() !== req.member.id && req.member.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this listing'
      });
    }
    
    marketItem = await MarketItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: marketItem
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete marketplace listing
// @route   DELETE /api/agriculture/marketplace/:id
// @access  Private
exports.deleteMarketListing = async (req, res, next) => {
  try {
    const marketItem = await MarketItem.findById(req.params.id);
    
    if (!marketItem) {
      return res.status(404).json({
        success: false,
        error: 'Marketplace listing not found'
      });
    }
    
    // Make sure user is the seller
    if (marketItem.seller.toString() !== req.member.id && req.member.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this listing'
      });
    }
    
    await marketItem.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// ===== RESOURCE SHARING FUNCTIONS =====

// @desc    Create resource sharing listing
// @route   POST /api/agriculture/resources
// @access  Private
exports.createResourceSharing = async (req, res, next) => {
  try {
    req.body.owner = req.member.id;
    
    const resourceSharing = await ResourceSharing.create(req.body);
    
    res.status(201).json({
      success: true,
      data: resourceSharing
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all resource sharing listings
// @route   GET /api/agriculture/resources
// @access  Private
exports.getResourceSharings = async (req, res, next) => {
  try {
    // Build query with filters
    let query = {};
    
    // Filter by resource type
    if (req.query.resourceType) {
      query.resourceType = req.query.resourceType;
    }
    
    // Filter by sharing basis
    if (req.query.sharingBasis) {
      query.sharingBasis = req.query.sharingBasis;
    }
    
    // Filter by active status
    if (req.query.status) {
      query.status = req.query.status;
    } else {
      query.status = 'active';
    }
    
    // Check if only user's resources are requested
    if (req.query.myResources === 'true') {
      query.owner = req.member.id;
    }
    
    const resources = await ResourceSharing.find(query)
      .populate('owner', 'firstName lastName phone')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: resources.length,
      data: resources
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single resource sharing listing
// @route   GET /api/agriculture/resources/:id
// @access  Private
exports.getResourceSharing = async (req, res, next) => {
  try {
    const resource = await ResourceSharing.findById(req.params.id)
      .populate('owner', 'firstName lastName phone email');
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource sharing listing not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update resource sharing listing
// @route   PUT /api/agriculture/resources/:id
// @access  Private
exports.updateResourceSharing = async (req, res, next) => {
  try {
    let resource = await ResourceSharing.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource sharing listing not found'
      });
    }
    
    // Make sure user is the owner
    if (resource.owner.toString() !== req.member.id && req.member.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this resource'
      });
    }
    
    resource = await ResourceSharing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Book a resource
// @route   POST /api/agriculture/resources/:id/book
// @access  Private
exports.bookResource = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Please provide start and end dates'
      });
    }
    
    const resource = await ResourceSharing.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource sharing listing not found'
      });
    }
    
    // Check if the resource is active
    if (resource.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'This resource is not currently available for booking'
      });
    }
    
    // Check if dates are valid
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end || start < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range'
      });
    }
    
    // Check if there are any conflicts with existing bookings
    const conflicts = resource.availabilitySchedule.some(schedule => {
      const scheduleStart = new Date(schedule.startDate);
      const scheduleEnd = new Date(schedule.endDate);
      
      return (
        (schedule.status === 'booked') &&
        (
          (start >= scheduleStart && start < scheduleEnd) ||
          (end > scheduleStart && end <= scheduleEnd) ||
          (start <= scheduleStart && end >= scheduleEnd)
        )
      );
    });
    
    if (conflicts) {
      return res.status(400).json({
        success: false,
        error: 'Resource is already booked for the selected dates'
      });
    }
    
    // Add the booking to the availability schedule
    resource.availabilitySchedule.push({
      startDate: start,
      endDate: end,
      status: 'booked'
    });
    
    await resource.save();
    
    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (err) {
    next(err);
  }
};

// ===== FORUM FUNCTIONS =====

// @desc    Create forum post
// @route   POST /api/agriculture/forum
// @access  Private
exports.createForumPost = async (req, res, next) => {
  try {
    req.body.author = req.member.id;
    
    // Check if this is a success story
    if (req.body.category === 'success-story') {
      req.body.isSuccessStory = true;
    }
    
    const forumPost = await ForumPost.create(req.body);
    
    res.status(201).json({
      success: true,
      data: forumPost
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all forum posts
// @route   GET /api/agriculture/forum
// @access  Private
exports.getForumPosts = async (req, res, next) => {
  try {
    // Build query with filters
    let query = {};
    
    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filter success stories
    if (req.query.successStories === 'true') {
      query.isSuccessStory = true;
    }
    
    // Show only published posts
    query.status = 'published';
    
    // Get posts with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const posts = await ForumPost.find(query)
      .populate('author', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await ForumPost.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: posts.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total
      },
      data: posts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single forum post
// @route   GET /api/agriculture/forum/:id
// @access  Private
exports.getForumPost = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate('author', 'firstName lastName profileImage')
      .populate('comments.author', 'firstName lastName profileImage');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Forum post not found'
      });
    }
    
    // Increment view count
    post.views += 1;
    await post.save();
    
    res.status(200).json({
      success: true,
      data: post
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add comment to forum post
// @route   POST /api/agriculture/forum/:id/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Forum post not found'
      });
    }
    
    // Add comment to the post
    post.comments.push({
      author: req.member.id,
      content: req.body.content
    });
    
    await post.save();
    
    // Get updated post with populated authors
    const updatedPost = await ForumPost.findById(req.params.id)
      .populate('author', 'firstName lastName profileImage')
      .populate('comments.author', 'firstName lastName profileImage');
    
    res.status(200).json({
      success: true,
      data: updatedPost
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upvote a forum post
// @route   PUT /api/agriculture/forum/:id/upvote
// @access  Private
exports.upvotePost = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Forum post not found'
      });
    }
    
    // Check if user already upvoted
    if (post.upvotes.includes(req.member.id)) {
      // Remove upvote (toggle)
      post.upvotes = post.upvotes.filter(
        upvote => upvote.toString() !== req.member.id
      );
    } else {
      // Add upvote
      post.upvotes.push(req.member.id);
    }
    
    await post.save();
    
    res.status(200).json({
      success: true,
      data: post
    });
  } catch (err) {
    next(err);
  }
};

// ===== EXPERT CONSULTATION FUNCTIONS =====

// @desc    Request expert consultation
// @route   POST /api/agriculture/consultations
// @access  Private
exports.requestConsultation = async (req, res, next) => {
  try {
    req.body.member = req.member.id;
    
    const consultation = await Consultation.create(req.body);
    
    res.status(201).json({
      success: true,
      data: consultation
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get member consultations
// @route   GET /api/agriculture/consultations
// @access  Private
exports.getMyConsultations = async (req, res, next) => {
  try {
    const consultations = await Consultation.find({ member: req.member.id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: consultations.length,
      data: consultations
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get consultation details
// @route   GET /api/agriculture/consultations/:id
// @access  Private
exports.getConsultation = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        error: 'Consultation not found'
      });
    }
    
    // Make sure consultation belongs to user or user is admin
    if (consultation.member.toString() !== req.member.id && req.member.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }
    
    res.status(200).json({
      success: true,
      data: consultation
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update consultation (Admin only)
// @route   PUT /api/agriculture/consultations/:id
// @access  Private/Admin
exports.updateConsultation = async (req, res, next) => {
  try {
    let consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        error: 'Consultation not found'
      });
    }
    
    consultation = await Consultation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: consultation
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all success stories
// @route   GET /api/agriculture/success-stories
// @access  Private
exports.getSuccessStories = async (req, res, next) => {
  try {
    const successStories = await ForumPost.find({ 
      isSuccessStory: true, 
      status: 'published' 
    })
      .populate('author', 'firstName lastName profileImage')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: successStories.length,
      data: successStories
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get agriculture dashboard data
// @route   GET /api/agriculture/dashboard
// @access  Private
exports.getAgricultureDashboard = async (req, res, next) => {
  try {
    // Get marketplace stats
    const activeListings = await MarketItem.countDocuments({ status: 'available' });
    const myListings = await MarketItem.countDocuments({ 
      seller: req.member.id,
      status: { $in: ['available', 'reserved'] }
    });
    
    // Get resources stats
    const availableResources = await ResourceSharing.countDocuments({ status: 'active' });
    const mySharedResources = await ResourceSharing.countDocuments({ 
      owner: req.member.id,
      status: 'active'
    });
    
    // Get forum stats
    const forumPosts = await ForumPost.countDocuments({ status: 'published' });
    const myForumPosts = await ForumPost.countDocuments({ 
      author: req.member.id,
      status: 'published'
    });
    
    // Get recent marketplace items
    const recentMarketItems = await MarketItem.find({ status: 'available' })
      .populate('seller', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent forum posts
    const recentForumPosts = await ForumPost.find({ status: 'published' })
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get upcoming consultations
    const upcomingConsultations = await Consultation.find({
      member: req.member.id,
      status: 'scheduled',
      scheduledDate: { $gte: new Date() }
    }).sort({ scheduledDate: 1 });
    
    res.status(200).json({
      success: true,
      data: {
        marketplace: {
          activeListings,
          myListings,
          recentItems: recentMarketItems
        },
        resources: {
          availableResources,
          mySharedResources
        },
        forum: {
          totalPosts: forumPosts,
          myPosts: myForumPosts,
          recentPosts: recentForumPosts
        },
        consultations: {
          upcoming: upcomingConsultations
        }
      }
    });
  } catch (err) {
    next(err);
  }
};