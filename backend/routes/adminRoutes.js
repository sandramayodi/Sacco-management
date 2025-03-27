// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Adjust path based on your structure
const adminController = require('../controllers/adminController');
const memberController = require('../controllers/memberController');
const savingsController = require('../controllers/savingsController');
const loanController = require('../controllers/loanController');
const reportController = require('../controllers/reportController');
const marketplaceController = require('../controllers/marketplaceController');
const resourceSharingController = require('../controllers/resourceSharingController');

// Protect all admin routes
router.use(auth.protect);
router.use(auth.isAdmin); // Require admin role for all routes

// Dashboard routes
router.get('/dashboard', adminController.getDashboard);
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/recent-activity', adminController.getRecentActivity);

// Member management routes
router.get('/members', memberController.getAllMembers);
router.get('/members/:id', memberController.getMemberDetails);
router.put('/members/:id/status', memberController.updateMemberStatus);
router.put('/members/:id/role', memberController.updateMemberRole);
router.post('/members/new', memberController.createMember);
router.delete('/members/:id', memberController.deleteMember);
router.get('/members/search', memberController.searchMembers);
router.get('/members/verify', memberController.getPendingVerifications);
router.put('/members/:id/verify', memberController.verifyMember);

// Share capital management
router.get('/share-capital/transactions', adminController.getShareCapitalTransactions);
router.post('/share-capital/transactions', adminController.recordShareCapitalTransaction);
router.get('/share-capital/summary', adminController.getShareCapitalSummary);

// Savings management routes
router.get('/savings/accounts', savingsController.getAllSavingsAccounts);
router.get('/savings/accounts/:id', savingsController.getSavingsAccountDetails);
router.put('/savings/accounts/:id/status', savingsController.updateSavingsAccountStatus);
router.get('/savings/transactions', savingsController.getAllTransactions);
router.post('/savings/transactions', savingsController.recordTransaction);
router.post('/savings/process-dividends', savingsController.processDividends);
router.get('/savings/goal-based', savingsController.getGoalBasedSavings);

// Loan management routes
router.get('/loans/products', loanController.getAllLoanProducts);
router.post('/loans/products', loanController.createLoanProduct);
router.put('/loans/products/:id', loanController.updateLoanProduct);
router.delete('/loans/products/:id', loanController.deleteLoanProduct);
router.get('/loans/products/:id', loanController.getLoanProductDetails);

router.get('/loans/applications', loanController.getAllLoanApplications);
router.get('/loans/applications/pending', loanController.getPendingApplications);
router.get('/loans/applications/:id', loanController.getLoanApplicationDetails);
router.put('/loans/applications/:id/status', loanController.updateApplicationStatus);
router.post('/loans/applications/:id/approve', loanController.approveLoanApplication);
router.post('/loans/applications/:id/reject', loanController.rejectLoanApplication);
router.post('/loans/applications/:id/request-expert-review', loanController.requestExpertReview);

router.get('/loans/accounts', loanController.getAllLoanAccounts);
router.get('/loans/accounts/:id', loanController.getLoanAccountDetails);
router.post('/loans/disburse/:id', loanController.disburseLoan);
router.get('/loans/repayments', loanController.getAllRepayments);
router.post('/loans/repayments', loanController.recordRepayment);
router.get('/loans/overdue', loanController.getOverdueLoans);

// Financial operations routes
router.get('/transactions', adminController.getAllTransactions);
router.get('/transactions/:id', adminController.getTransactionDetails);
router.post('/transactions', adminController.recordTransaction);
router.get('/accounts/statements', adminController.generateAccountStatements);

// Report routes
router.get('/reports/financial', reportController.getFinancialReports);
router.get('/reports/member-activity', reportController.getMemberActivityReports);
router.get('/reports/loan-performance', reportController.getLoanPerformanceReports);
router.get('/reports/savings-trends', reportController.getSavingsTrendsReports);
router.get('/reports/agricultural-impact', reportController.getAgriculturalImpactReports);
router.post('/reports/custom', reportController.generateCustomReport);
router.get('/reports/download/:id', reportController.downloadReport);

// Marketplace administration
router.get('/marketplace/listings', marketplaceController.getAllListings);
router.get('/marketplace/listings/:id', marketplaceController.getListingDetails);
router.put('/marketplace/listings/:id/status', marketplaceController.updateListingStatus);
router.delete('/marketplace/listings/:id', marketplaceController.deleteListing);
router.get('/marketplace/categories', marketplaceController.getCategories);
router.post('/marketplace/categories', marketplaceController.createCategory);

// Resource sharing administration
router.get('/resource-sharing', resourceSharingController.getAllResources);
router.get('/resource-sharing/:id', resourceSharingController.getResourceDetails);
router.put('/resource-sharing/:id/status', resourceSharingController.updateResourceStatus);
router.get('/resource-sharing/bookings', resourceSharingController.getAllBookings);
router.put('/resource-sharing/bookings/:id/status', resourceSharingController.updateBookingStatus);

// Forum administration
router.get('/forum/posts', adminController.getAllForumPosts);
router.get('/forum/posts/:id', adminController.getForumPostDetails);
router.put('/forum/posts/:id/status', adminController.updateForumPostStatus);
router.delete('/forum/posts/:id', adminController.deleteForumPost);
router.get('/forum/flagged', adminController.getFlaggedPosts);
router.post('/forum/categories', adminController.createForumCategory);

// Expert management
router.get('/experts', adminController.getAllExperts);
router.post('/experts/assign/:memberId', adminController.assignExpertRole);
router.put('/experts/:id/status', adminController.updateExpertStatus);
router.get('/expert-consultations', adminController.getExpertConsultations);

// System settings
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);
router.get('/audit-logs', adminController.getAuditLogs);
router.post('/backup', adminController.createBackup);
router.post('/restore', adminController.restoreBackup);

// routes/adminRoutes.js (add this to your existing adminRoutes)

// Create admin user route (only accessible by existing admins)
router.post('/create-admin', auth.protect, auth.isAdmin, async (req, res) => {
    try {
      const { firstName, lastName, email, password, idNumber, phoneNumber } = req.body;
      
      // Check if user already exists
      const existingUser = await Member.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          status: 'fail',
          message: 'User with this email already exists'
        });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Generate member ID
      const memberId = 'ADM' + Math.floor(100000 + Math.random() * 900000);
      
      // Create new admin
      const newAdmin = await Member.create({
        memberId,
        firstName,
        lastName,
        idNumber,
        phoneNumber,
        email,
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        accountStatus: 'active'
      });
      
      // Remove password from response
      newAdmin.password = undefined;
      
      // Create admin log
      await AdminLog.create({
        logId: 'LOG' + Date.now(),
        adminId: req.member._id,
        action: 'created_admin',
        entityType: 'member',
        entityId: newAdmin._id,
        description: `Admin ${req.member.firstName} created new admin user: ${newAdmin.firstName} ${newAdmin.lastName}`,
        ipAddress: req.ip
      });
      
      res.status(201).json({
        status: 'success',
        data: {
          admin: newAdmin
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });
  
  // Create expert user route (only accessible by admins)
  router.post('/assign-expert-role/:memberId', auth.protect, auth.isAdmin, async (req, res) => {
    try {
      const { memberId } = req.params;
      const { specializations, experience, biography } = req.body;
      
      // Find the member
      const member = await Member.findById(memberId);
      if (!member) {
        return res.status(404).json({
          status: 'fail',
          message: 'Member not found'
        });
      }
      
      // Update member role
      member.role = 'agricultural-expert';
      await member.save();
      
      // Create expert profile
      const expertProfile = await ExpertProfile.create({
        memberId: member._id,
        specializations: specializations || [],
        experience: experience || { years: 0, details: '' },
        biography: biography || '',
        isVerified: true,
        verificationDate: new Date(),
        verifiedBy: req.member._id
      });
      
      // Create admin log
      await AdminLog.create({
        logId: 'LOG' + Date.now(),
        adminId: req.member._id,
        action: 'assigned_expert_role',
        entityType: 'member',
        entityId: member._id,
        description: `Admin ${req.member.firstName} assigned expert role to: ${member.firstName} ${member.lastName}`,
        ipAddress: req.ip
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          member,
          expertProfile
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });

// Export the router
module.exports = router;