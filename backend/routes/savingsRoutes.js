const express = require('express');
const {
  createSaving,
  getMySavings,
  getSaving,
  updateSaving,
  getSavingsSummary,
  processDividends,
  processMobileMoneyPayment
} = require('../controllers/savingsController');

const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createSaving);
router.get('/', protect, getMySavings);
router.get('/summary', protect, getSavingsSummary);
router.post('/dividends', protect, admin, processDividends);
router.post('/mobile-money', protect, processMobileMoneyPayment);
router.get('/:id', protect, getSaving);
router.put('/:id', protect, updateSaving);

module.exports = router;