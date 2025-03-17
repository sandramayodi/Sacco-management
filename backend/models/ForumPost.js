
// models/ForumPost.js
const mongoose = require('mongoose');

const ForumPostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'Member',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a post title'],
    trim: true,
    maxlength: [150, 'Title cannot be more than 150 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add post content']
  },
  category: {
    type: String,
    enum: ['crop-farming', 'livestock', 'soil-management', 'pest-control', 'irrigation', 'financing', 'market-prices', 'general', 'success-story'],
    required: true
  },
  tags: [{
    type: String
  }],
  images: [{
    type: String
  }],
  upvotes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Member'
  }],
  views: {
    type: Number,
    default: 0
  },
  comments: [{
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'Member'
    },
    content: {
      type: String,
      required: [true, 'Please add a comment']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isSuccessStory: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['published', 'hidden'],
    default: 'published'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ForumPost', ForumPostSchema);
