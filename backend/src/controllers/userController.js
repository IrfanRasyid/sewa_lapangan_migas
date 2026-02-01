const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getMe = async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile', error: err.message });
    }
};

exports.updateMe = async (req, res) => {
    const { name, phone, password } = req.body;
    const userId = req.userId;

    try {
        let query = 'UPDATE users SET name = $1, phone = $2';
        let values = [name, phone];
        let valueCounter = 3;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password = $${valueCounter}`;
            values.push(hashedPassword);
            valueCounter++;
        }

        query += ` WHERE id = $${valueCounter} RETURNING id, name, email, phone, role, created_at`;
        values.push(userId);

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully', data: result.rows[0] });
    } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ message: 'Error updating profile', error: err.message });
    }
};
