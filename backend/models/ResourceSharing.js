
// models/ResourceSharing.js
const mongoose = require('mongoose');

const ResourceSharingSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'Member',
    required: true
  },
  resourceType: {
    type: String,
    enum: ['land', 'tractor', 'irrigation-equipment', 'processing-machine', 'storage-facility', 'other'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  sharingBasis: {
    type: String,
    enum: ['free', 'fee', 'exchange', 'communal'],
    required: true
  },
  fee: {
    type: Number,
    required: function() {
      return this.sharingBasis === 'fee';
    }
  },
  feeUnit: {
    type: String,
    required: function() {
      return this.sharingBasis === 'fee';
    }
  },
  availabilitySchedule: [{
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['available', 'booked'],
      default: 'available'
    }
  }],
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ResourceSharing', ResourceSharingSchema);
