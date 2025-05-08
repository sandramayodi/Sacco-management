// controllers/loanController.js
const Loan = require("../models/Loan");
const Transaction = require("../models/Transaction");
const Member = require("../models/Member");

// @desc    Apply for a loan
// @route   POST /api/loans/apply
// @access  Private
exports.applyForLoan = async (req, res, next) => {
  try {
    // Check member eligibility (must be verified and have share capital)
    const member = await Member.findById(req.member.id);

    // if (!member.verified) {
    //   return res.status(400).json({
    //     success: false,
    //     error: "You must be a verified member to apply for loans",
    //   });
    // }

    // if (member.shareCapital < 1000) {
    //   // Minimum share capital requirement
    //   return res.status(400).json({
    //     success: false,
    //     error: "You need a minimum share capital of 1000 to apply for loans",
    //   });
    // }

    // Set member ID to the request body
    req.body.member = req.member.id;

    // Calculate interest rate based on loan type
    let interestRate;
    switch (req.body.loanType) {
      case "seed":
        interestRate = 10;
        break;
      case "equipment":
        interestRate = 12;
        break;
      case "fertilizer":
        interestRate = 8;
        break;
      case "livestock":
        interestRate = 12;
        break;
      case "storage":
        interestRate = 9;
        break;
      case "general":
        interestRate = 14;
        break;
      default:
        interestRate = 12;
    }
    req.body.interestRate = interestRate;

    // Create loan application
    const loan = await Loan.create(req.body);

    // Generate repayment schedule
    loan.repaymentSchedule = loan.generateRepaymentSchedule();
    await loan.save();

    // Create transaction record for the application
    await Transaction.create({
      member: req.member.id,
      // transactionType: "loan-application",
      amount: req.body.amount,
      reference: `LOAN-APP-${loan._id}`,
      relatedLoan: loan._id,
      status: "completed",
      description: `Loan application - ${req.body.loanType} - ${req.body.purpose}`,
    });

    res.status(201).json({
      success: true,
      data: loan,
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
    const loans = await Loan.find({
      member: req.member.id,
    });

    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans,
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
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: "Loan not found",
      });
    }

    // Make sure user owns the loan or is admin
    if (
      loan.member.toString() !== req.member.id &&
      req.member.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to access this resource",
      });
    }

    res.status(200).json({
      success: true,
      data: loan,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process loan repayment
// @route   POST /api/loans/:id/repayment
// @access  Private
exports.processRepayment = async (req, res, next) => {
  try {
    const { installmentNumber, amount, paymentMethod, transactionReference } =
      req.body;

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: "Loan not found",
      });
    }

    // Make sure user owns the loan
    if (
      loan.member.toString() !== req.member.id &&
      req.member.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to access this resource",
      });
    }

    // Check if loan is disbursed
    if (loan.status !== "disbursed" && loan.status !== "repaying") {
      return res.status(400).json({
        success: false,
        error: "Cannot repay a loan that has not been disbursed",
      });
    }

    // Find the installment
    const installmentIndex = loan.repaymentSchedule.findIndex(
      (inst) => inst.installmentNumber === parseInt(installmentNumber)
    );

    if (installmentIndex === -1) {
      return res.status(400).json({
        success: false,
        error: "Installment not found",
      });
    }

    const installment = loan.repaymentSchedule[installmentIndex];

    // Check if installment is already paid
    if (installment.status === "paid") {
      return res.status(400).json({
        success: false,
        error: "This installment has already been paid",
      });
    }

    // Update installment
    installment.paidAmount = parseFloat(amount);
    installment.status = "paid";
    installment.paymentDate = Date.now();

    loan.repaymentSchedule[installmentIndex] = installment;

    // Update loan status
    if (loan.status === "disbursed") {
      loan.status = "repaying";
    }

    // Check if all installments are paid
    const allPaid = loan.repaymentSchedule.every(
      (inst) => inst.status === "paid"
    );
    if (allPaid) {
      loan.status = "fully-paid";
    }

    await loan.save();

    // Create transaction record
    await Transaction.create({
      member: req.member.id,
      transactionType: "loan-repayment",
      amount: parseFloat(amount),
      reference: transactionReference,
      relatedLoan: loan._id,
      status: "completed",
      description: `Loan repayment - Installment #${installmentNumber}`,
    });

    res.status(200).json({
      success: true,
      data: {
        loan,
        message: "Payment processed successfully",
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all loan applications (admin only)
// @route   GET /api/loans/applications
// @access  Private/Admin
exports.getAllLoanApplications = async (req, res, next) => {
  try {
    // Get query parameters for filtering
    const status = req.query.status;
    const loanType = req.query.type;

    // Build query
    let query = {};

    if (status) {
      query.status = status;
    }

    if (loanType) {
      query.loanType = loanType;
    }

    const loans = await Loan.find(query)
      .populate({
        path: "member",
        select: "firstName lastName email phone nationalId",
      })
      .sort({ applicationDate: -1 });

    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Review loan application (admin only)
// @route   PUT /api/loans/:id/review
// @access  Private/Admin
exports.reviewLoanApplication = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: "Loan not found",
      });
    }

    // Update loan application status
    loan.status = status;
    loan.reviewedBy = req.member.id;

    if (status === "approved") {
      loan.approvalDate = Date.now();
    } else if (status === "rejected") {
      loan.rejectionReason = rejectionReason;
    }

    await loan.save();

    res.status(200).json({
      success: true,
      data: loan,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Disburse loan (admin only)
// @route   PUT /api/loans/:id/disburse
// @access  Private/Admin
exports.disburseLoan = async (req, res, next) => {
  try {
    const { disbursementMethod, transactionReference } = req.body;

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: "Loan not found",
      });
    }

    // Check if loan is approved
    if (loan.status !== "approved") {
      return res.status(400).json({
        success: false,
        error: "Only approved loans can be disbursed",
      });
    }

    // Update loan status
    loan.status = "disbursed";
    loan.disbursementDate = Date.now();

    await loan.save();

    // Create transaction record for disbursement
    await Transaction.create({
      member: loan.member,
      transactionType: "loan-disbursement",
      amount: loan.amount,
      reference: transactionReference || `DISB-${loan._id}`,
      relatedLoan: loan._id,
      paymentMethod: disbursementMethod || "bank-transfer",
      status: "completed",
      description: `Loan disbursement - ${loan.loanType} - ${loan.purpose}`,
    });

    res.status(200).json({
      success: true,
      data: loan,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get loan statistics (admin only)
// @route   GET /api/loans/stats
// @access  Private/Admin
exports.getLoanStats = async (req, res, next) => {
  try {
    // Total loans disbursed
    const totalDisbursed = await Loan.aggregate([
      { $match: { status: { $in: ["disbursed", "repaying", "fully-paid"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Active loans
    const activeLoans = await Loan.aggregate([
      { $match: { status: { $in: ["disbursed", "repaying"] } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$amount" } } },
    ]);

    // Loans by type
    const loansByType = await Loan.aggregate([
      { $match: { status: { $in: ["disbursed", "repaying", "fully-paid"] } } },
      {
        $group: {
          _id: "$loanType",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]);

    // Pending applications
    const pendingApplications = await Loan.countDocuments({
      status: { $in: ["applied", "under-review"] },
    });

    res.status(200).json({
      success: true,
      data: {
        totalDisbursed: totalDisbursed.length > 0 ? totalDisbursed[0].total : 0,
        activeLoans: {
          count: activeLoans.length > 0 ? activeLoans[0].count : 0,
          amount: activeLoans.length > 0 ? activeLoans[0].total : 0,
        },
        loansByType,
        pendingApplications,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process mobile money payment for loan
// @route   POST /api/loans/:id/mobile-money
// @access  Private
exports.processMobileMoneyPayment = async (req, res, next) => {
  try {
    const { phoneNumber, amount, installmentNumber } = req.body;

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: "Loan not found",
      });
    }

    // Make sure user owns the loan
    if (loan.member.toString() !== req.member.id) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to access this resource",
      });
    }

    // In a real application, this would integrate with a mobile money API
    // Here we'll simulate a successful mobile money transaction

    // Generate a transaction reference
    const transactionReference = `MM-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;

    // Find the installment
    const installmentIndex = loan.repaymentSchedule.findIndex(
      (inst) => inst.installmentNumber === parseInt(installmentNumber)
    );

    if (installmentIndex === -1) {
      return res.status(400).json({
        success: false,
        error: "Installment not found",
      });
    }

    // Update installment
    const installment = loan.repaymentSchedule[installmentIndex];
    installment.paidAmount = parseFloat(amount);
    installment.status = "paid";
    installment.paymentDate = Date.now();

    loan.repaymentSchedule[installmentIndex] = installment;

    // Update loan status
    if (loan.status === "disbursed") {
      loan.status = "repaying";
    }

    // Check if all installments are paid
    const allPaid = loan.repaymentSchedule.every(
      (inst) => inst.status === "paid"
    );
    if (allPaid) {
      loan.status = "fully-paid";
    }

    await loan.save();

    // Create transaction record
    await Transaction.create({
      member: req.member.id,
      transactionType: "loan-repayment",
      amount: parseFloat(amount),
      reference: transactionReference,
      relatedLoan: loan._id,
      paymentMethod: "mobile-money",
      externalReference: transactionReference,
      status: "completed",
      description: `Mobile money loan repayment - Installment #${installmentNumber}`,
    });

    res.status(200).json({
      success: true,
      data: {
        loan,
        transactionReference,
        message: "Mobile money payment processed successfully",
      },
    });
  } catch (err) {
    next(err);
  }
};
