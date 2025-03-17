// controllers/financialController.js
const Transaction = require('../models/Transaction');
const Member = require('../models/Member');
const Loan = require('../models/Loan');
const Saving = require('../models/Saving');

// @desc    Get member transactions
// @route   GET /api/financial/transactions
// @access  Private
exports.getMyTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ member: req.member.id })
      .sort({ transactionDate: -1 });
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get account statement
// @route   GET /api/financial/statement
// @access  Private
exports.getAccountStatement = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Format dates for filtering
    const fromDate = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const toDate = endDate ? new Date(endDate) : new Date();
    
    // Set end of day for toDate
    toDate.setHours(23, 59, 59, 999);

    // Get all transactions for the member within the date range
    const transactions = await Transaction.find({
      member: req.member.id,
      transactionDate: {
        $gte: fromDate,
        $lte: toDate
      }
    }).sort({ transactionDate: 1 });

    // Get member details
    const member = await Member.findById(req.member.id);

    // Calculate balance progression
    let runningBalance = 0;
    const transactionsWithBalance = transactions.map(transaction => {
      // Determine if transaction increases or decreases balance
      if (['saving-deposit', 'loan-disbursement', 'dividend-payment'].includes(transaction.transactionType)) {
        runningBalance += transaction.amount;
      } else if (['saving-withdrawal', 'loan-repayment', 'fee-payment'].includes(transaction.transactionType)) {
        runningBalance -= transaction.amount;
      }

      return {
        ...transaction.toObject(),
        balance: runningBalance
      };
    });

    // Calculate statement summary
    const summary = {
      startDate: fromDate,
      endDate: toDate,
      memberName: `${member.firstName} ${member.lastName}`,
      memberNumber: member._id,
      openingBalance: transactionsWithBalance.length > 0 ? 
        transactionsWithBalance[0].balance - getTransactionAmount(transactionsWithBalance[0]) : 0,
      closingBalance: transactionsWithBalance.length > 0 ? 
        transactionsWithBalance[transactionsWithBalance.length - 1].balance : 0,
      totalDeposits: transactions
        .filter(t => t.transactionType === 'saving-deposit')
        .reduce((sum, t) => sum + t.amount, 0),
      totalWithdrawals: transactions
        .filter(t => t.transactionType === 'saving-withdrawal')
        .reduce((sum, t) => sum + t.amount, 0),
      totalLoanDisbursements: transactions
        .filter(t => t.transactionType === 'loan-disbursement')
        .reduce((sum, t) => sum + t.amount, 0),
      totalLoanRepayments: transactions
        .filter(t => t.transactionType === 'loan-repayment')
        .reduce((sum, t) => sum + t.amount, 0),
      transactionCount: transactions.length
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        transactions: transactionsWithBalance
      }
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to get transaction amount effect on balance
const getTransactionAmount = (transaction) => {
  if (['saving-deposit', 'loan-disbursement', 'dividend-payment'].includes(transaction.transactionType)) {
    return transaction.amount;
  } else if (['saving-withdrawal', 'loan-repayment', 'fee-payment'].includes(transaction.transactionType)) {
    return -transaction.amount;
  }
  return 0;
};

// @desc    Get financial dashboard summary
// @route   GET /api/financial/dashboard
// @access  Private
exports.getDashboardSummary = async (req, res, next) => {
  try {
    // Get member financial summary
    const member = await Member.findById(req.member.id);
    
    // Get savings summary
    const savings = await Saving.find({ member: req.member.id });
    const totalSavings = savings.reduce((sum, saving) => sum + saving.amount, 0);
    
    // Get active loans
    const activeLoans = await Loan.find({ 
      member: req.member.id,
      status: { $in: ['disbursed', 'repaying'] }
    });
    
    const totalOutstandingLoans = activeLoans.reduce((sum, loan) => {
      // Calculate remaining balance
      const totalPaid = loan.repaymentSchedule.reduce((paid, installment) => 
        paid + (installment.paidAmount || 0), 0);
      return sum + (loan.amount - totalPaid);
    }, 0);
    
    // Get recent transactions
    const recentTransactions = await Transaction.find({ member: req.member.id })
      .sort({ transactionDate: -1 })
      .limit(5);
    
    // Calculate next due payments
    const nextDuePayments = [];
    
    activeLoans.forEach(loan => {
      const nextDue = loan.repaymentSchedule
        .filter(installment => installment.status === 'pending')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
      
      if (nextDue) {
        nextDuePayments.push({
          loanId: loan._id,
          loanType: loan.loanType,
          installmentNumber: nextDue.installmentNumber,
          dueDate: nextDue.dueDate,
          amount: nextDue.amount
        });
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        shareCapital: member.shareCapital,
        totalSavings,
        totalOutstandingLoans,
        nextDuePayments: nextDuePayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
        recentTransactions
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process mobile banking transaction
// @route   POST /api/financial/mobile-banking
// @access  Private
exports.processMobileBanking = async (req, res, next) => {
  try {
    const { transactionType, amount, paymentMethod, destinationId, notes } = req.body;
    
    if (paymentMethod !== 'mobile-money') {
      return res.status(400).json({
        success: false,
        error: 'Only mobile money transactions are supported for mobile banking'
      });
    }
    
    // Generate transaction reference
    const transactionReference = `MOB-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Create transaction record
    const transaction = await Transaction.create({
      member: req.member.id,
      transactionType,
      amount,
      reference: transactionReference,
      paymentMethod,
      status: 'completed',
      description: notes || `Mobile banking ${transactionType}`,
      externalReference: transactionReference
    });
    
    // Process based on transaction type
    let additionalData = {};
    
    if (transactionType === 'saving-deposit') {
      // Create saving record
      const saving = await Saving.create({
        member: req.member.id,
        amount,
        savingType: 'regular',
        transactionReference,
        paymentMethod,
        status: 'completed'
      });
      
      transaction.relatedSaving = saving._id;
      await transaction.save();
      
      additionalData.saving = saving;
    } else if (transactionType === 'loan-repayment' && destinationId) {
      // Update loan repayment
      const loan = await Loan.findById(destinationId);
      
      if (!loan) {
        return res.status(404).json({
          success: false,
          error: 'Loan not found'
        });
      }
      
      if (loan.member.toString() !== req.member.id) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized to repay this loan'
        });
      }
      
      // Find next pending installment
      const pendingInstallmentIndex = loan.repaymentSchedule.findIndex(
        installment => installment.status === 'pending'
      );
      
      if (pendingInstallmentIndex !== -1) {
        const installment = loan.repaymentSchedule[pendingInstallmentIndex];
        installment.paidAmount = amount;
        installment.paidDate = Date.now();
        installment.status = amount >= installment.amount ? 'paid' : 'pending';
        
        // Update loan status if needed
        if (loan.status === 'disbursed') {
          loan.status = 'repaying';
        }
        
        // Check if loan is fully paid
        const isFullyPaid = loan.repaymentSchedule.every(
          inst => inst.status === 'paid'
        );
        
        if (isFullyPaid) {
          loan.status = 'fully-paid';
        }
        
        await loan.save();
        
        transaction.relatedLoan = loan._id;
        await transaction.save();
        
        additionalData.loan = loan;
        additionalData.installment = installment;
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        transaction,
        ...additionalData
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all transactions (Admin only)
// @route   GET /api/financial/transactions/all
// @access  Private/Admin
exports.getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate('member', 'firstName lastName email')
      .sort({ transactionDate: -1 });
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get financial statistics (Admin only)
// @route   GET /api/financial/stats
// @access  Private/Admin
exports.getFinancialStats = async (req, res, next) => {
  try {
    // Get all transactions
    const transactions = await Transaction.find();
    
    // Get total by transaction type
    const totalByType = {
      'saving-deposit': 0,
      'saving-withdrawal': 0,
      'loan-disbursement': 0,
      'loan-repayment': 0,
      'share-purchase': 0,
      'dividend-payment': 0,
      'fee-payment': 0,
      'other': 0
    };
    
    transactions.forEach(transaction => {
      totalByType[transaction.transactionType] += transaction.amount;
    });
    
    // Calculate net position
    const netPosition = 
      totalByType['saving-deposit'] + 
      totalByType['loan-repayment'] + 
      totalByType['share-purchase'] + 
      totalByType['fee-payment'] - 
      totalByType['saving-withdrawal'] - 
      totalByType['loan-disbursement'] - 
      totalByType['dividend-payment'];
    
    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .populate('member', 'firstName lastName')
      .sort({ transactionDate: -1 })
      .limit(10);
    
    // Get transaction count by payment method
    const countByPaymentMethod = {
      'mobile-money': 0,
      'bank-transfer': 0,
      'cash': 0,
      'internal-transfer': 0
    };
    
    transactions.forEach(transaction => {
      countByPaymentMethod[transaction.paymentMethod]++;
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalByType,
        netPosition,
        countByPaymentMethod,
        recentTransactions,
        transactionCount: transactions.length
      }
    });
  } catch (err) {
    next(err);
  }
};