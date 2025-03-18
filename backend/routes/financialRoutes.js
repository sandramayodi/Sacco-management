// routes/financialRoutes.js
const express = require('express');
const {
  getMyTransactions,
  getAccountStatement,
  getDashboardSummary,
  processMobileBanking,
  getAllTransactions,
  getFinancialStats
} = require('../controllers/financialController');

const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/transactions', protect, getMyTransactions);
router.get('/transactions/all', protect, admin, getAllTransactions);
router.get('/statement', protect, getAccountStatement);
router.get('/dashboard', protect, getDashboardSummary);
router.get('/stats', protect, admin, getFinancialStats);
router.post('/mobile-banking', protect, processMobileBanking);

module.exports = router;