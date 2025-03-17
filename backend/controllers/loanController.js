// controllers/loanController.js
const Loan = require('../models/Loan');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const creditScoring = require('../utils/creditScoring');

// @desc    Apply for a loan
// @route   POST /api/loans
// @access  Private
exports.applyForLoan = async (req, res, next) => {
  try {
    req.body.member = req.member.id;
    
    // Calculate credit score
    const creditScore = await creditScoring.calculateCreditScore(req.member.id);
    req.body.creditScore = creditScore;
    
    // Initialize loan with application status
    req.body.status = 'applied';
    
    // Create loan
    const loan = await Loan.create(req.body);
    
    res.status(201).json({
      success: true,
      data: loan
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all loans for logged in member
// @route   GET /api/loans
// @access  Private
exports.getMyLoans = async (req, res, next) => {
  try {
    const loans = await Loan.find({ member: req.member.id });
    
    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single loan
// @route   GET /api/loans/:id
// @access  Private
exports.getLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('member', 'firstName lastName email phone');
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }
    
    // Make sure user is loan owner or admin
    if (loan.member._id.toString() !== req.member.id && req.member.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }
    
    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update loan application
// @route   PUT /api/loans/:id
// @access  Private
exports.updateLoanApplication = async (req, res, next) => {
  try {
    let loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }
    
    // Make sure user is loan owner
    if (loan.member.toString() !== req.member.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this loan'
      });
    }
    
    // Only allow updates if loan is still in applied status
    if (loan.status !== 'applied') {
      return res.status(400).json({
        success: false,
        error: 'Loan can only be updated when in applied status'
      });
    }
    
    // Fields that can be updated by the member
    const fieldsToUpdate = {
      loanType: req.body.loanType,
      amount: req.body.amount,
      term: req.body.term,
      purpose: req.body.purpose,
      collateral: req.body.collateral,
      guarantors: req.body.guarantors,
      documents: req.body.documents
    };
    
    loan = await Loan.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Review loan application (Admin only)
// @route   PUT /api/loans/:id/review
// @access  Private/Admin
exports.reviewLoan = async (req, res, next) => {
  try {
    const { status, interestRate, approvalNotes } = req.body;
    
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }
    
    // Update the loan status
    loan.status = status;
    
    if (status === 'approved') {
      loan.approvalDate = Date.now();
      loan.interestRate = interestRate || loan.interestRate;
      
      // Generate repayment schedule
      loan.repaymentSchedule = generateRepaymentSchedule(
        loan.amount,
        loan.interestRate,
        loan.term
      );
    }
    
    await loan.save();
    
    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Disburse loan (Admin only)
// @route   PUT /api/loans/:id/disburse
// @access  Private/Admin
exports.disburseLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }
    
    // Make sure loan is approved
    if (loan.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Only approved loans can be disbursed'
      });
    }
    
    // Update loan status
    loan.status = 'disbursed';
    loan.disbursementDate = Date.now();
    
    await loan.save();
    
    // Create transaction for loan disbursement
    await Transaction.create({
      member: loan.member,
      transactionType: 'loan-disbursement',
      amount: loan.amount,
      reference: `LOAN-DISB-${loan._id}`,
      relatedLoan: loan._id,
      paymentMethod: req.body.paymentMethod,
      status: 'completed',
      description: `Loan disbursement for ${loan.loanType} loan`
    });
    
    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record loan repayment
// @route   POST /api/loans/:id/repayment
// @access  Private
exports.recordRepayment = async (req, res, next) => {
  try {
    const { amount, installmentNumber, paymentMethod, transactionReference } = req.body;
    
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }
    
    // Ensure the loan belongs to the member
    if (loan.member.toString() !== req.member.id && req.member.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }
    
    // Check if loan is disbursed or in repaying status
    if (loan.status !== 'disbursed' && loan.status !== 'repaying') {
      return res.status(400).json({
        success: false,
        error: 'Can only repay disbursed or repaying loans'
      });
    }
    
    // Update loan status if first repayment
    if (loan.status === 'disbursed') {
      loan.status = 'repaying';
    }
    
    // Find the installment
    if (loan.repaymentSchedule.length <= installmentNumber - 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid installment number'
      });
    }
    
    const installment = loan.repaymentSchedule[installmentNumber - 1];
    
    // Update the installment
    installment.paidAmount = amount;
    installment.paidDate = Date.now();
    installment.status = amount >= installment.amount ? 'paid' : 'pending';
    
    // Check if loan is fully paid
    const isFullyPaid = loan.repaymentSchedule.every(
      installment => installment.status === 'paid'
    );
    
    if (isFullyPaid) {
      loan.status = 'fully-paid';
    }
    
    await loan.save();
    
    // Create transaction record
    await Transaction.create({
      member: loan.member,
      transactionType: 'loan-repayment',
      amount,
      reference: transactionReference || `LOAN-REP-${loan._id}-${installmentNumber}`,
      relatedLoan: loan._id,
      paymentMethod,
      status: 'completed',
      description: `Loan repayment for installment #${installmentNumber}`
    });
    
    res.status(200).json({
      success: true,
      data: {
        loan,
        paidInstallment: installment
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all loans (Admin only)
// @route   GET /api/loans/all
// @access  Private/Admin
exports.getAllLoans = async (req, res, next) => {
  try {
    const loans = await Loan.find().populate('member', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get loan statistics (Admin only)
// @route   GET /api/loans/stats
// @access  Private/Admin
exports.getLoanStats = async (req, res, next) => {
  try {
    // Get all loans
    const loans = await Loan.find();
    
    // Calculate total loans amount
    const totalLoansAmount = loans.reduce((total, loan) => {
      if (loan.status === 'disbursed' || loan.status === 'repaying' || loan.status === 'fully-paid') {
        return total + loan.amount;
      }
      return total;
    }, 0);
    
    // Count loans by status
    const loansByStatus = {
      applied: 0,
      'under-review': 0,
      approved: 0,
      rejected: 0,
      disbursed: 0,
      repaying: 0,
      'fully-paid': 0,
      defaulted: 0
    };
    
    loans.forEach(loan => {
      loansByStatus[loan.status]++;
    });
    
    // Count loans by type
    const loansByType = {
      seed: 0,
      equipment: 0,
      fertilizer: 0,
      general: 0,
      emergency: 0
    };
    
    loans.forEach(loan => {
      loansByType[loan.loanType]++;
    });
    
    // Calculate average loan amount
    const activeLoanCount = loans.filter(
      loan => loan.status === 'disbursed' || loan.status === 'repaying'
    ).length;
    
    const averageLoanAmount = activeLoanCount > 0 
      ? totalLoansAmount / activeLoanCount 
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalLoansAmount,
        activeLoanCount,
        averageLoanAmount,
        loansByStatus,
        loansByType
      }
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to generate repayment schedule
const generateRepaymentSchedule = (principal, interestRate, term) => {
  const monthlyInterestRate = interestRate / 100 / 12;
  const monthlyPayment = 
    (principal * monthlyInterestRate) / 
    (1 - Math.pow(1 + monthlyInterestRate, -term));
  
  const schedule = [];
  
  let remainingPrincipal = principal;
  
  for (let i = 1; i <= term; i++) {
    const interestPayment = remainingPrincipal * monthlyInterestRate;
    const principalPayment = monthlyPayment - interestPayment;
    
    remainingPrincipal -= principalPayment;
    
    // In case of rounding errors for the last payment
    if (i === term) {
      schedule.push({
        installmentNumber: i,
        dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000), // Approximately one month
        amount: principalPayment + interestPayment + remainingPrincipal,
        principal: principalPayment + remainingPrincipal,
        interest: interestPayment,
        status: 'pending'
      });
    } else {
      schedule.push({
        installmentNumber: i,
        dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000), // Approximately one month
        amount: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        status: 'pending'
      });
    }
  }
  
  return schedule;
};