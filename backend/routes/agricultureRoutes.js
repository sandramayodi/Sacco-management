

// routes/agricultureRoutes.js
const express = require('express');
const {
  createMarketListing,
  getMarketListings,
  getMarketListing,
  updateMarketListing,
  deleteMarketListing,
  createResourceSharing,
  getResourceSharings,
  getResourceSharing,
  updateResourceSharing,
  bookResource,
  createForumPost,
  getForumPosts,
  getForumPost,
  addComment,
  upvotePost,
  requestConsultation,
  getMyConsultations,
  getConsultation,
  updateConsultation,
  getSuccessStories,
  getAgricultureDashboard
} = require('../controllers/agricultureController');

const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Marketplace routes
router.post('/marketplace', protect, createMarketListing);
router.get('/marketplace', protect, getMarketListings);
router.get('/marketplace/:id', protect, getMarketListing);
router.put('/marketplace/:id', protect, updateMarketListing);
router.delete('/marketplace/:id', protect, deleteMarketListing);

// Resource sharing routes
router.post('/resources', protect, createResourceSharing);
router.get('/resources', protect, getResourceSharings);
router.get('/resources/:id', protect, getResourceSharing);
router.put('/resources/:id', protect, updateResourceSharing);
router.post('/resources/:id/book', protect, bookResource);

// Forum routes
router.post('/forum', protect, createForumPost);
router.get('/forum', protect, getForumPosts);
router.get('/forum/:id', protect, getForumPost);
router.post('/forum/:id/comments', protect, addComment);
router.put('/forum/:id/upvote', protect, upvotePost);

// Consultation routes
router.post('/consultations', protect, requestConsultation);
router.get('/consultations', protect, getMyConsultations);
router.get('/consultations/:id', protect, getConsultation);
router.put('/consultations/:id', protect, admin, updateConsultation);

// Success stories
router.get('/success-stories', protect, getSuccessStories);

// Dashboard
router.get('/dashboard', protect, getAgricultureDashboard);

module.exports = router;
