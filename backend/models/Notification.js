
// models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'Member',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a notification title']
  },
  message: {
    type: String,
    required: [true, 'Please add a notification message']
  },
  type: {
    type: String,
    enum: ['loan', 'saving', 'market', 'resource', 'forum', 'consultation', 'general'],
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);