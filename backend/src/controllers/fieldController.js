const db = require('../config/db');

exports.getAllFields = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM fields ORDER BY id ASC');
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching fields', error: err.message });
  }
};

exports.getFieldById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM fields WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Field not found' });
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching field', error: err.message });
  }
};

exports.getFieldBookings = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM bookings WHERE field_id = $1', [id]);
        res.json({ data: result.rows });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching bookings', error: err.message });
    }
};

exports.createField = async (req, res) => {
    const { name, type, price_per_hour, image_url, description } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO fields (name, type, price_per_hour, image_url, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, type, price_per_hour, image_url, description]
        );
        res.status(201).json({ data: result.rows[0], message: 'Field created successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error creating field', error: err.message });
    }
};

exports.updateField = async (req, res) => {
    const { id } = req.params;
    const { name, type, price_per_hour, image_url, description } = req.body;
    try {
        const result = await db.query(
            'UPDATE fields SET name = $1, type = $2, price_per_hour = $3, image_url = $4, description = $5 WHERE id = $6 RETURNING *',
            [name, type, price_per_hour, image_url, description, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Field not found' });
        }
        res.json({ data: result.rows[0], message: 'Field updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating field', error: err.message });
    }
};

exports.deleteField = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM fields WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Field not found' });
        }
        res.json({ message: 'Field deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting field', error: err.message });
    }
};
