const db = require('../config/db');

exports.getMe = async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile', error: err.message });
    }
};
