const db = require('../config/db');

exports.getAllBookings = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT b.*, u.name as user_name, f.name as field_name, p.proof_url, p.status as payment_status
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN fields f ON b.field_id = f.id
            LEFT JOIN payments p ON b.id = p.booking_id
            ORDER BY b.created_at DESC
        `);
        res.json({ data: result.rows });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching bookings', error: err.message });
    }
};

exports.updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 

    try {
        const result = await db.query(
            'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json({ data: result.rows[0], message: 'Status updated successfully' });
    } catch (err) {
         res.status(500).json({ message: 'Error updating status', error: err.message });
    }
};
