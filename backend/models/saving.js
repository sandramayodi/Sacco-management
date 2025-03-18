
// models/Saving.js
const mongoose = require('mongoose');

const SavingSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.ObjectId,
    ref: 'Member',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount']
  },
  savingType: {
    type: String,
    enum: ['regular', 'goal-based'],
    required: true
  },
  goalName: {
    type: String,
    required: function() {
      return this.savingType === 'goal-based';
    }
  },
  goalAmount: {
    type: Number,
    required: function() {
      return this.savingType === 'goal-based';
    }
  },
  goalDeadline: {
    type: Date,
    required: function() {
      return this.savingType === 'goal-based';
    }
  },
  transactionReference: {
    type: String,
    required: true
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['mobile-money', 'bank-transfer', 'cash'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Saving', SavingSchema);


