// // routes/expertRoutes.js
// const express = require('express');
// const router = express.Router();
// const auth = require('../middleware/auth'); // Adjust path based on your structure
// const expertController = require('../controllers/expertController');
// const forumController = require('../controllers/forumController');
// const loanController = require('../controllers/loanController');
// const marketplaceController = require('../controllers/marketplaceController');
// const knowledgeBaseController = require('../controllers/knowledgeBaseController');

// // Protect all expert routes
// router.use(auth.protect);
// router.use(auth.isExpert); // Require expert role for all routes

// // Dashboard routes
// router.get('/dashboard', expertController.getDashboard);
// router.get('/dashboard/stats', expertController.getDashboardStats);

// // Consultation routes
// router.get('/consultations', expertController.getConsultations);
// router.get('/consultations/:id', expertController.getConsultationDetails);
// router.put('/consultations/:id/status', expertController.updateConsultationStatus);
// router.post('/consultations/:id/notes', expertController.addConsultationNotes);
// router.get('/consultations/upcoming', expertController.getUpcomingConsultations);
// router.post('/consultations/:id/reschedule', expertController.rescheduleConsultation);

// // Forum management
// router.get('/forum/pending-responses', forumController.getPendingExpertResponses);
// router.post('/forum/posts/:id/respond', forumController.addExpertResponse);
// router.get('/forum/my-contributions', forumController.getExpertContributions);
// router.put('/forum/posts/:id/highlight', forumController.highlightPost);

// // Loan review routes
// router.get('/loans/pending-review', loanController.getLoansForExpertReview);
// router.post('/loans/:id/technical-review', loanController.submitExpertReview);
// router.get('/loans/:id/details', loanController.getLoanApplicationDetails);
// router.get('/loans/reviewed', loanController.getReviewedLoans);

// // Knowledge base management
// router.get('/knowledge-base/articles', knowledgeBaseController.getMyArticles);
// router.post('/knowledge-base/articles', knowledgeBaseController.createArticle);
// router.put('/knowledge-base/articles/:id', knowledgeBaseController.updateArticle);
// router.delete('/knowledge-base/articles/:id', knowledgeBaseController.deleteArticle);
// router.get('/knowledge-base/articles/:id', knowledgeBaseController.getArticleDetails);
// router.put('/knowledge-base/articles/:id/publish', knowledgeBaseController.publishArticle);

// // Agricultural marketplace involvement
// router.get('/marketplace/listings', marketplaceController.getListings);
// router.post('/marketplace/listings/:id/verify', marketplaceController.verifyListing);
// router.post('/marketplace/listings/:id/comment', marketplaceController.addExpertComment);

// // Success stories
// router.get('/success-stories', expertController.getSuccessStories);
// router.put('/success-stories/:id/verify', expertController.verifySuccessStory);
// router.post('/success-stories/:id/comment', expertController.commentOnSuccessStory);

// // Resource sharing
// router.get('/resources/available', expertController.getAvailableResources);
// router.post('/resources/recommend', expertController.recommendResource);

// // Expert profile management
// router.get('/profile', expertController.getProfile);
// router.put('/profile', expertController.updateProfile);
// router.put('/profile/specialization', expertController.updateSpecialization);
// router.put('/profile/availability', expertController.updateAvailability);
// router.get('/profile/statistics', expertController.getExpertStatistics);

// // Export the router
// module.exports = router;
