
// routes/notificationRoutes.js
const express = require('express');
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  broadcastNotification
} = require('../controllers/notificationController');

const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.get('/unread/count', protect, getUnreadCount);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);
router.post('/', protect, admin, createNotification);
router.post('/broadcast', protect, admin, broadcastNotification);

module.exports = router;