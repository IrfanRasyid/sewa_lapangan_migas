const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/bookings', verifyToken, isAdmin, adminController.getAllBookings);
router.put('/bookings/:id/status', verifyToken, isAdmin, adminController.updateBookingStatus);

// User Management Routes
router.get('/users', verifyToken, isAdmin, adminController.getAllUsers);
router.put('/users/:id', verifyToken, isAdmin, adminController.updateUser);
router.put('/users/:id/password', verifyToken, isAdmin, adminController.updateUserPassword);

module.exports = router;
