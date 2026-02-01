const db = require('../config/db');

exports.createBooking = async (req, res) => {
    const { field_id, start_time, end_time } = req.body;
    const userId = req.userId;

    // Validate inputs
    if (!field_id || !start_time || !end_time) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // 1. Check if field exists and get price
        const fieldResult = await db.query('SELECT price_per_hour FROM fields WHERE id = $1', [field_id]);
        if (fieldResult.rows.length === 0) {
            return res.status(404).json({ message: 'Field not found' });
        }
        const pricePerHour = parseFloat(fieldResult.rows[0].price_per_hour);

        // 2. Check for overlap
        // Overlap logic: (start1 < end2) AND (end1 > start2)
        const overlapCheck = await db.query(
            `SELECT * FROM bookings 
             WHERE field_id = $1 
             AND status != 'cancelled'
             AND start_time < $3 
             AND end_time > $2`,
            [field_id, start_time, end_time]
        );

        if (overlapCheck.rows.length > 0) {
            return res.status(409).json({ message: 'Field is already booked for this time slot' });
        }

        // 3. Calculate total price
        const start = new Date(start_time);
        const end = new Date(end_time);
        const durationHours = (end - start) / (1000 * 60 * 60);
        
        if (durationHours <= 0) {
             return res.status(400).json({ message: 'Invalid time range' });
        }

        const totalPrice = durationHours * pricePerHour;

        // 4. Create Booking
        const result = await db.query(
            `INSERT INTO bookings (user_id, field_id, start_time, end_time, total_price, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')
             RETURNING *`,
            [userId, field_id, start_time, end_time, totalPrice]
        );

        res.status(201).json({ message: 'Booking created', data: result.rows[0] });

    } catch (err) {
        res.status(500).json({ message: 'Error creating booking', error: err.message });
    }
};

exports.getMyBookings = async (req, res) => {
    const userId = req.userId;
    try {
        // Join with fields to get field name
        const result = await db.query(
            `SELECT b.*, f.name as field_name, f.image_url 
             FROM bookings b
             JOIN fields f ON b.field_id = f.id
             WHERE b.user_id = $1
             ORDER BY b.created_at DESC`,
            [userId]
        );
        res.json({ data: result.rows });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching bookings', error: err.message });
    }
};

exports.uploadPaymentProof = async (req, res) => {
    const { id } = req.params; // booking id
    const userId = req.userId;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Verify booking belongs to user
        const bookingCheck = await db.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [id, userId]);
        if (bookingCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found or access denied' });
        }

        // Convert to Base64 Data URI (Store directly in DB to avoid Storage dependencies)
        const base64Image = file.buffer.toString('base64');
        const proofUrl = `data:${file.mimetype};base64,${base64Image}`;

        // Insert Payment or Update
        const paymentCheck = await db.query('SELECT * FROM payments WHERE booking_id = $1', [id]);
        
        if (paymentCheck.rows.length > 0) {
            // Update existing
            await db.query(
                'UPDATE payments SET proof_url = $1, status = $2 WHERE booking_id = $3',
                [proofUrl, 'pending', id]
            );
        } else {
            // Create new
            await db.query(
                'INSERT INTO payments (booking_id, amount, proof_url, status) VALUES ($1, $2, $3, $4)',
                [id, bookingCheck.rows[0].total_price, proofUrl, 'pending']
            );
        }
        
        res.json({ message: 'Payment proof uploaded successfully', proof_url: proofUrl });

    } catch (err) {
        console.error("Payment proof upload error:", err);
        res.status(500).json({ message: 'Error uploading proof', error: err.message });
    }
};
