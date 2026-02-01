const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/bookings', verifyToken, isAdmin, adminController.getAllBookings);
router.put('/bookings/:id/status', verifyToken, isAdmin, adminController.updateBookingStatus);

module.exports = router;
