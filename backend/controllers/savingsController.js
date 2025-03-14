// controllers/savingsController.js
const Saving = require('../models/Saving');
const Transaction = require('../models/Transaction');
const Member = require('../models/Member');

// @desc    Create a new saving deposit
// @route   POST /api/savings
// @access  Private
exports.createSaving = async (req, res, next) => {
  try {
    req.body.member = req.member.id;
    
    const saving = await Saving.create(req.body);

    // Create a transaction record
    await Transaction.create({
      member: req.member.id,
      transactionType: 'saving-deposit',
      amount: req.body.amount,
      reference: req.body.transactionReference,
      relatedSaving: saving._id,
      paymentMethod: req.body.paymentMethod,
      status: 'completed',
      description: `Saving deposit - ${req.body.savingType === 'goal-based' ? req.body.goalName : 'Regular'}`
    });

    res.status(201).json({
      success: true,
      data: saving
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all savings for logged in member
// @route   GET /api/savings
// @access  Private
exports.getMySavings = async (req, res, next) => {
  try {
    const savings = await Saving.find({ member: req.member.id });

    res.status(200).json({
      success: true,
      count: savings.length,
      data: savings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single saving record
// @route   GET /api/savings/:id
// @access  Private
exports.getSaving = async (req, res, next) => {
  try {
    const saving = await Saving.findById(req.params.id);

    if (!saving) {
      return res.status(404).json({
        success: false,
        error: 'Saving not found'
      });
    }

    // Make sure user owns the saving
    if (saving.member.toString() !== req.member.id && req.member.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }

    res.status(200).json({
      success: true,
      data: saving
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update saving details
// @route   PUT /api/savings/:id
// @access  Private
exports.updateSaving = async (req, res, next) => {
  try {
    let saving = await Saving.findById(req.params.id);

    if (!saving) {
      return res.status(404).json({
        success: false,
        error: 'Saving not found'
      });
    }

    // Make sure user owns the saving or is admin
    if (saving.member.toString() !== req.member.id && req.member.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this resource'
      });
    }

    // Only certain fields can be updated
    const fieldsToUpdate = {
      goalName: req.body.goalName,
      goalAmount: req.body.goalAmount,
      goalDeadline: req.body.goalDeadline
    };

    saving = await Saving.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: saving
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get savings summary for logged in member
// @route   GET /api/savings/summary
// @access  Private
exports.getSavingsSummary = async (req, res, next) => {
  try {
    // Get all savings for the member
    const savings = await Saving.find({ member: req.member.id });

    // Calculate total savings
    const totalSavings = savings.reduce((acc, saving) => acc + saving.amount, 0);

    // Calculate goal-based savings
    const goalBasedSavings = savings
      .filter(saving => saving.savingType === 'goal-based')
      .reduce((acc, curr) => {
        // Check if goal already exists in accumulator
        const existingGoalIndex = acc.findIndex(item => item.goalName === curr.goalName);
        
        if (existingGoalIndex !== -1) {
          // Update existing goal
          acc[existingGoalIndex].currentAmount += curr.amount;
        } else {
          // Add new goal
          acc.push({
            goalName: curr.goalName,
            targetAmount: curr.goalAmount,
            currentAmount: curr.amount,
            deadline: curr.goalDeadline,
            progress: (curr.amount / curr.goalAmount) * 100
          });
        }
        
        return acc;
      }, []);
    
    // Calculate regular savings
    const regularSavings = savings
      .filter(saving => saving.savingType === 'regular')
      .reduce((acc, curr) => acc + curr.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        totalSavings,
        regularSavings,
        goalBasedSavings,
        savingsCount: savings.length
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process dividend calculations (Admin only)
// @route   POST /api/savings/dividends
// @access  Private/Admin
exports.processDividends = async (req, res, next) => {
  try {
    const { year, rate, totalDividendAmount } = req.body;
    
    if (!year || !rate || !totalDividendAmount) {
      return res.status(400).json({
        success: false,
        error: 'Please provide year, dividend rate, and total dividend amount'
      });
    }

    // Get all members
    const members = await Member.find({ verified: true });
    
    // Calculate total share capital
    const totalShareCapital = members.reduce((acc, member) => acc + member.shareCapital, 0);
    
    // Calculate and distribute dividends to each member
    const dividendDistribution = [];
    
    for (const member of members) {
      if (member.shareCapital > 0) {
        // Calculate individual dividend
        const memberSharePercentage = member.shareCapital / totalShareCapital;
        const dividendAmount = totalDividendAmount * memberSharePercentage;
        
        // Create transaction record for dividend
        const transaction = await Transaction.create({
          member: member._id,
          transactionType: 'dividend-payment',
          amount: dividendAmount,
          reference: `DIV-${year}-${member._id}`,
          paymentMethod: 'internal-transfer',
          status: 'completed',
          description: `Dividend payment for year ${year} at ${rate}% rate`
        });
        
        dividendDistribution.push({
          memberId: member._id,
          memberName: `${member.firstName} ${member.lastName}`,
          shareCapital: member.shareCapital,
          sharePercentage: memberSharePercentage * 100,
          dividendAmount,
          transactionId: transaction._id
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        year,
        rate,
        totalDividendAmount,
        totalShareCapital,
        memberCount: members.length,
        dividendDistribution
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process mobile money integration for savings
// @route   POST /api/savings/mobile-money
// @access  Private
exports.processMobileMoneyPayment = async (req, res, next) => {
  try {
    const { phoneNumber, amount, savingType, goalName, goalAmount, goalDeadline } = req.body;
    
    // In a real application, this would integrate with a mobile money API
    // Here we'll simulate a successful mobile money transaction
    
    // Generate a transaction reference
    const transactionReference = `MM-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Create a new saving
    const savingData = {
      member: req.member.id,
      amount,
      savingType,
      transactionReference,
      paymentMethod: 'mobile-money',
      status: 'completed'
    };
    
    // Add goal details if it's goal-based saving
    if (savingType === 'goal-based') {
      savingData.goalName = goalName;
      savingData.goalAmount = goalAmount;
      savingData.goalDeadline = goalDeadline;
    }
    
    const saving = await Saving.create(savingData);
    
    // Create transaction record
    await Transaction.create({
      member: req.member.id,
      transactionType: 'saving-deposit',
      amount,
      reference: transactionReference,
      relatedSaving: saving._id,
      paymentMethod: 'mobile-money',
      externalReference: transactionReference,
      status: 'completed',
      description: `Mobile money saving deposit - ${savingType === 'goal-based' ? goalName : 'Regular'}`
    });
    
    res.status(200).json({
      success: true,
      data: {
        saving,
        transactionReference,
        message: 'Mobile money payment processed successfully'
      }
    });
  } catch (err) {
    next(err);
  }
};