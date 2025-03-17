// controllers/notificationController.js
const Notification = require('../models/Notification');

// @desc    Get member notifications
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.member.id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread/count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.member.id,
      isRead: false
    });
    
    res.status(200).json({
      success: true,
      count
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    // Make sure notification belongs to user
    if (notification.recipient.toString() !== req.member.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this notification'
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.member.id, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    // Make sure notification belongs to user
    if (notification.recipient.toString() !== req.member.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this notification'
      });
    }
    
    await notification.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to create a notification (used internally)
exports.createNotification = async (recipientId, title, message, type, relatedId = null, priority = 'medium') => {
  try {
    return await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      relatedId,
      priority
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// @desc    Create notification (Admin only)
// @route   POST /api/notifications
// @access  Private/Admin
exports.createNotification = async (req, res, next) => {
  try {
    const notification = await Notification.create(req.body);
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send notification to all members (Admin only)
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
exports.broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type, priority } = req.body;
    
    // Get all members
    const Member = require('../models/Member');
    const members = await Member.find();
    
    // Create notifications for each member
    const notifications = [];
    
    for (const member of members) {
      const notification = await Notification.create({
        recipient: member._id,
        title,
        message,
        type,
        priority: priority || 'medium'
      });
      
      notifications.push(notification);
    }
    
    res.status(201).json({
      success: true,
      count: notifications.length,
      message: `Notification sent to ${notifications.length} members`
    });
  } catch (err) {
    next(err);
  }
};