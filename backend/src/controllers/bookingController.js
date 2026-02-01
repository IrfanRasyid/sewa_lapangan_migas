const db = require('../config/db');

exports.createBooking = async (req, res) => {
    const { field_id, start_time, end_time, is_member_booking } = req.body;
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

        // Calculate Duration
        const start = new Date(start_time);
        const end = new Date(end_time);
        const durationHours = (end - start) / (1000 * 60 * 60);
        
        if (durationHours <= 0) {
             return res.status(400).json({ message: 'Invalid time range' });
        }

        const sessionPrice = durationHours * pricePerHour;
        
        // Prepare sessions (1 session for regular, 4 sessions for member)
        let sessions = [];
        if (is_member_booking) {
            for (let i = 0; i < 4; i++) {
                const sessionStart = new Date(start);
                sessionStart.setDate(start.getDate() + (i * 7));
                
                const sessionEnd = new Date(end);
                sessionEnd.setDate(end.getDate() + (i * 7));
                
                sessions.push({ start: sessionStart, end: sessionEnd });
            }
        } else {
            sessions.push({ start: start, end: end });
        }

        // 2. Check for overlap for ALL sessions
        for (const session of sessions) {
             const overlapCheck = await db.query(
                `SELECT * FROM bookings 
                 WHERE field_id = $1 
                 AND status != 'cancelled'
                 AND start_time < $3 
                 AND end_time > $2`,
                [field_id, session.start.toISOString(), session.end.toISOString()]
            );

            if (overlapCheck.rows.length > 0) {
                return res.status(409).json({ 
                    message: `Field is already booked for time slot: ${session.start.toLocaleString()}` 
                });
            }
        }

        // 3. Create Bookings
        let firstBooking = null;

        for (let i = 0; i < sessions.length; i++) {
            const session = sessions[i];
            
            // For member booking:
            // 1st booking carries the full price (4 * sessionPrice)
            // 2nd, 3rd, 4th bookings carry 0 price
            // This ensures payment logic works for the 'package'
            let price = sessionPrice;
            if (is_member_booking) {
                if (i === 0) {
                    price = sessionPrice * 4;
                } else {
                    price = 0;
                }
            }

            const result = await db.query(
                `INSERT INTO bookings (user_id, field_id, start_time, end_time, total_price, status)
                 VALUES ($1, $2, $3, $4, $5, 'pending')
                 RETURNING *`,
                [userId, field_id, session.start.toISOString(), session.end.toISOString(), price]
            );

            if (i === 0) {
                firstBooking = result.rows[0];
            }
        }

        res.status(201).json({ message: 'Booking created', data: firstBooking });

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
