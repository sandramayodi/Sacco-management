// middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Member = require('../models/Member');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this resource'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    req.member = await Member.findById(decoded.id);

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this resource'
    });
  }
};



/**
 * Middleware to restrict access to specific roles
 * @param {Array} roles - Array of allowed roles
 */
exports.restrictTo = (roles) => {
  return (req, res, next) => {
      if (!roles.includes(req.member.role)) {
          return res.status(403).json({
              status: 'fail',
              message: 'You do not have permission to perform this action'
          });
      }
      next();
  };
};

/**
* Middleware to check if user is an admin
*/
exports.isAdmin = (req, res, next) => {
  if (req.member.role !== 'admin') {
      return res.status(403).json({
          status: 'fail',
          message: 'This route is restricted to administrators'
      });
  }
  next();
};

/**
* Middleware to check if user is an agricultural expert
*/
exports.isExpert = (req, res, next) => {
  if (req.member.role !== 'agricultural-expert') {
      return res.status(403).json({
          status: 'fail',
          message: 'This route is restricted to agricultural experts'
      });
  }
  next();
};

/**
* Middleware to check if user is a regular member
*/
exports.isMember = (req, res, next) => {
  if (req.member.role !== 'member') {
      return res.status(403).json({
          status: 'fail',
          message: 'This route is restricted to regular members'
      });
  }
  next();
};

/**
* Middleware to check if user is requesting their own resource
* Used for routes where members should only access their own data
* @param {String} paramIdField - The request parameter containing the ID to check
*/
exports.isResourceOwner = (paramIdField) => {
  return (req, res, next) => {
      const resourceId = req.params[paramIdField];
      
      // Admin can access any resource
      if (req.member.role === 'admin') {
          return next();
      }
      
      // Check if the requested resource belongs to the authenticated user
      if (req.member._id.toString() !== resourceId && 
          req.member.memberId !== resourceId) {
          return res.status(403).json({
              status: 'fail',
              message: 'You are not authorized to access this resource'
          });
      }
      
      next();
  };
};




// Admin middleware
exports.admin = (req, res, next) => {
  if (req.member && req.member.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to perform this action'
    });
  }
};




// Login handler
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide email and password'
            });
        }
        
        // Check if member exists and password is correct
        const member = await Member.findOne({ email }).select('+password');
        
        if (!member || !(await bcrypt.compare(password, member.password))) {
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect email or password'
            });
        }
        
        // Generate token with role information
        const token = jwt.sign(
            { 
                id: member._id,
                role: member.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        // Remove password from output
        member.password = undefined;
        
        res.status(200).json({
            status: 'success',
            token,
            data: {
                member,
                role: member.role
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Protect middleware
exports.protect = async (req, res, next) => {
    try {
        // Get token
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'You are not logged in. Please log in to get access.'
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if member still exists
        const currentMember = await Member.findById(decoded.id);
        if (!currentMember) {
            return res.status(401).json({
                status: 'fail',
                message: 'The member no longer exists.'
            });
        }
        
        // Add member and role to request
        req.member = currentMember;
        req.role = currentMember.role;
        next();
    } catch (error) {
        res.status(401).json({
            status: 'fail',
            message: 'Not authorized to access this route'
        });
    }
};

// Role-specific middleware
exports.restrictTo = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.member.role)) {
            return res.status(403).json({
                status: 'fail',
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

// Convenience middleware for specific roles
exports.isAdmin = (req, res, next) => {
    if (req.member.role !== 'admin') {
        return res.status(403).json({
            status: 'fail',
            message: 'This route is restricted to admin users'
        });
    }
    next();
};

exports.isExpert = (req, res, next) => {
    if (req.member.role !== 'agricultural-expert') {
        return res.status(403).json({
            status: 'fail',
            message: 'This route is restricted to agricultural experts'
        });
    }
    next();
};

exports.isMember = (req, res, next) => {
    if (req.member.role !== 'member') {
        return res.status(403).json({
            status: 'fail',
            message: 'This route is restricted to regular members'
        });
    }
    next();
};