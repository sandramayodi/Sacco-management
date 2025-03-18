
// routes/loanRoutes.js
const express = require('express');
const {
  applyForLoan,
  getMyLoans,
  getLoan,
  updateLoanApplication,
  reviewLoan,
  disburseLoan,
  recordRepayment,
  getAllLoans,
  getLoanStats
} = require('../controllers/loanController');

const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, applyForLoan);
router.get('/', protect, getMyLoans);
router.get('/all', protect, admin, getAllLoans);
router.get('/stats', protect, admin, getLoanStats);
router.get('/:id', protect, getLoan);
router.put('/:id', protect, updateLoanApplication);
router.put('/:id/review', protect, admin, reviewLoan);
router.put('/:id/disburse', protect, admin, disburseLoan);
router.post('/:id/repayment', protect, recordRepayment);

module.exports = router;