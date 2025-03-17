
// models/Transaction.js
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.ObjectId,
    ref: 'Member',
    required: true
  },
  transactionType: {
    type: String,
    enum: ['saving-deposit', 'saving-withdrawal', 'loan-disbursement', 'loan-repayment', 'share-purchase', 'dividend-payment', 'fee-payment', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount']
  },
  fee: {
    type: Number,
    default: 0
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  relatedLoan: {
    type: mongoose.Schema.ObjectId,
    ref: 'Loan'
  },
  relatedSaving: {
    type: mongoose.Schema.ObjectId,
    ref: 'Saving'
  },
  paymentMethod: {
    type: String,
    enum: ['mobile-money', 'bank-transfer', 'cash', 'internal-transfer'],
    required: true
  },
  externalReference: String,
  description: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'pending'
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
