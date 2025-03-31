// backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Dashboard routes
router.get("/dashboard", adminController.getDashboard);
router.get("/dashboard/stats", adminController.getDashboardStats);
router.get("/dashboard/recent-activity", adminController.getRecentActivity);

// Transaction routes
router.get("/transactions", adminController.getAllTransactions);
router.get("/transactions/:id", adminController.getTransactionDetails);
router.post("/transactions", adminController.recordTransaction);
router.get("/account-statements", adminController.generateAccountStatements);

// Share capital routes
router.get("/share-capital", adminController.getShareCapitalTransactions);
router.post("/share-capital", adminController.recordShareCapitalTransaction);
router.get("/share-capital/summary", adminController.getShareCapitalSummary);

// Forum management routes
router.get("/forum/posts", adminController.getAllForumPosts);
router.get("/forum/posts/:id", adminController.getForumPostDetails);
router.patch("/forum/posts/:id/status", adminController.updateForumPostStatus);
router.delete("/forum/posts/:id", adminController.deleteForumPost);
router.get("/forum/flagged-posts", adminController.getFlaggedPosts);
router.post("/forum/categories", adminController.createForumCategory);

// Expert management routes
router.get("/experts", adminController.getAllExperts);
router.post("/experts/assign", adminController.assignExpertRole);
router.patch("/experts/:id/status", adminController.updateExpertStatus);
router.get("/experts/consultations", adminController.getExpertConsultations);

// System administration routes
router.get("/system/settings", adminController.getSystemSettings);
router.patch("/system/settings", adminController.updateSystemSettings);
router.get("/system/audit-logs", adminController.getAuditLogs);
router.post("/system/backup", adminController.createBackup);
router.post("/system/restore", adminController.restoreBackup);

router.get("/loans/pending", adminController.getPendingLoans);

module.exports = router;
