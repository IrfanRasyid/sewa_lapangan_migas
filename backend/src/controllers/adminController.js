const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
        res.json({ data: result.rows });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;

    try {
        const result = await db.query(
            'UPDATE users SET name = $1, email = $2, phone = $3, role = $4 WHERE id = $5 RETURNING id, name, email, phone, role',
            [name, email, phone, role, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ data: result.rows[0], message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating user', error: err.message });
    }
};

exports.updateUserPassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 8);
        const result = await db.query(
            'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
            [hashedPassword, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating password', error: err.message });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT b.*, u.name as user_name, u.email as user_email, f.name as field_name, p.proof_url, p.status as payment_status
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
