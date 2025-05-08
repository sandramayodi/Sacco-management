// routes/loanRoutes.js
const express = require("express");
const {
  applyForLoan,
  getMyLoans,
  getLoan,
  processRepayment,
  getAllLoanApplications,
  reviewLoanApplication,
  disburseLoan,
  getLoanStats,
  processMobileMoneyPayment,
} = require("../controllers/loanController");

const { protect, admin } = require("../middleware/auth");

const router = express.Router();

// Member routes
router.post("/apply", protect, applyForLoan);
router.get("/", protect, getMyLoans);
router.get("/:id", protect, getLoan);
router.post("/:id/repayment", protect, processRepayment);
router.post("/:id/mobile-money", protect, processMobileMoneyPayment);

// Admin routes
router.get("/applications", protect, admin, getAllLoanApplications);
router.put("/:id/review", protect, admin, reviewLoanApplication);
router.put("/:id/disburse", protect, admin, disburseLoan);
router.get("/stats", protect, admin, getLoanStats);

module.exports = router;
