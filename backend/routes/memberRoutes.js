// routes/memberRoutes.js
const express = require('express');
const {
  registerMember,
  loginMember,
  getMe,
  updateProfile,
  updatePassword,
  addShareCapital,
  getMembers,
  getMember,
  verifyMember
} = require('../controllers/memberController');

const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerMember);
router.post('/login', loginMember);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/updatepassword', protect, updatePassword);
router.post('/sharecapital', protect, addShareCapital);
router.get('/', protect, admin, getMembers);
router.get('/:id', protect, admin, getMember);
router.put('/:id/verify', protect, admin, verifyMember);

module.exports = router;