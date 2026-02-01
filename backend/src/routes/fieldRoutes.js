const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/fieldController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/', fieldController.getAllFields);
router.get('/:id', fieldController.getFieldById);
router.get('/:id/bookings', fieldController.getFieldBookings);

// Admin Routes
router.post('/', verifyToken, isAdmin, fieldController.createField);
router.put('/:id', verifyToken, isAdmin, fieldController.updateField);
router.delete('/:id', verifyToken, isAdmin, fieldController.deleteField);

module.exports = router;
