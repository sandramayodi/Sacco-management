// controllers/memberController.js
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');

// @desc    Register member
// @route   POST /api/members/register
// @access  Public
exports.registerMember = async (req, res, next) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      password, 
      nationalId, 
      address, 
      farmSize, 
      farmLocation, 
      mainCrops, 
      mainLivestock 
    } = req.body;

    // Check if member exists
    const memberExists = await Member.findOne({ email });

    if (memberExists) {
      return res.status(400).json({
        success: false,
        error: 'Member with this email already exists'
      });
    }

    // Create member
    const member = await Member.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      nationalId,
      address,
      farmSize,
      farmLocation,
      mainCrops,
      mainLivestock
    });

    // Create token
    const token = member.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      data: member
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login member
// @route   POST /api/members/login
// @access  Public
exports.loginMember = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    // Check for member
    const member = await Member.findOne({ email }).select('+password');

    if (!member) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await member.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Create token
    const token = member.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      data: {
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        role: member.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in member
// @route   GET /api/members/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const member = await Member.findById(req.member.id);

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update member profile
// @route   PUT /api/members/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      address: req.body.address,
      farmSize: req.body.farmSize,
      farmLocation: req.body.farmLocation,
      mainCrops: req.body.mainCrops,
      mainLivestock: req.body.mainLivestock,
    };

    const member = await Member.findByIdAndUpdate(
      req.member.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update member password
// @route   PUT /api/members/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const member = await Member.findById(req.member.id).select('+password');

    // Check current password
    if (!(await member.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    member.password = req.body.newPassword;
    await member.save();

    // Create token
    const token = member.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add share capital
// @route   POST /api/members/sharecapital
// @access  Private
exports.addShareCapital = async (req, res, next) => {
  try {
    const { amount, paymentMethod, transactionReference } = req.body;

    // Update member share capital
    const member = await Member.findById(req.member.id);
    member.shareCapital += Number(amount);
    await member.save();

    // Create transaction record
    await Transaction.create({
      member: req.member.id,
      transactionType: 'share-purchase',
      amount,
      reference: transactionReference,
      paymentMethod,
      status: 'completed',
      description: 'Share capital contribution'
    });

    res.status(200).json({
      success: true,
      data: {
        currentShareCapital: member.shareCapital
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all members (admin only)
// @route   GET /api/members
// @access  Private/Admin
exports.getMembers = async (req, res, next) => {
  try {
    const members = await Member.find();

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single member (admin only)
// @route   GET /api/members/:id
// @access  Private/Admin
exports.getMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify a member (admin only)
// @route   PUT /api/members/:id/verify
// @access  Private/Admin
exports.verifyMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    member.verified = true;
    await member.save();

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (err) {
    next(err);
  }
};