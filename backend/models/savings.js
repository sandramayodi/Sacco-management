
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

// models/Loan.js
const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.ObjectId,
    ref: 'Member',
    required: true
  },
  loanType: {
    type: String,
    enum: ['seed', 'equipment', 'fertilizer', 'general', 'emergency'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add a loan amount']
  },
  interestRate: {
    type: Number,
    required: [true, 'Please add an interest rate']
  },
  term: {
    type: Number,
    required: [true, 'Please add a loan term in months']
  },
  purpose: {
    type: String,
    required: [true, 'Please add a loan purpose']
  },
  collateral: {
    type: String
  },
  guarantors: [{
    memberId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Member'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  creditScore: {
    type: Number
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  approvalDate: {
    type: Date
  },
  disbursementDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['applied', 'under-review', 'approved', 'rejected', 'disbursed', 'repaying', 'fully-paid', 'defaulted'],
    default: 'applied'
  },
  documents: [{
    name: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  repaymentSchedule: [{
    installmentNumber: Number,
    dueDate: Date,
    amount: Number,
    principal: Number,
    interest: Number,
    paidAmount: {
      type: Number,
      default: 0
    },
    paidDate: Date,
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Loan', LoanSchema);
