
// models/Consultation.js
const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.ObjectId,
    ref: 'Member',
    required: true
  },
  expert: {
    name: {
      type: String,
      required: true
    },
    specialty: {
      type: String,
      required: true
    },
    email: String,
    phone: String
  },
  topic: {
    type: String,
    required: [true, 'Please add a consultation topic']
  },
  description: {
    type: String,
    required: [true, 'Please add a description of your consultation needs']
  },
  preferredDate: {
    type: Date,
    required: [true, 'Please select a preferred date']
  },
  alternativeDate: Date,
  consultationType: {
    type: String,
    enum: ['in-person', 'phone', 'video-call'],
    required: true
  },
  status: {
    type: String,
    enum: ['requested', 'scheduled', 'completed', 'cancelled'],
    default: 'requested'
  },
  scheduledDate: Date,
  scheduledTime: String,
  duration: Number, // in minutes
  notes: String,
  followUp: {
    required: Boolean,
    date: Date,
    notes: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Consultation', ConsultationSchema);
