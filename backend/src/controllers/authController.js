const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 8);
    const userRole = role || 'user';
    
    const result = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, userRole]
    );

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
        return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    
    if (!user.password) {
        return res.status(400).json({ message: 'Please login with Google' });
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'secret_key', {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).json({
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login Error:', err); // Log error for debugging
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
};

exports.googleLogin = async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        let user;

        if (userResult.rows.length === 0) {
            // Create new user
            const newUser = await db.query(
                'INSERT INTO users (name, email, google_id, role) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, email, googleId, 'user']
            );
            user = newUser.rows[0];
        } else {
            user = userResult.rows[0];
            // Link google_id if not linked
            if (!user.google_id) {
                await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
            }
        }

        const jwtToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'secret_key', {
            expiresIn: 86400
        });

        res.status(200).json({
            token: jwtToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error("Google Login Error:", err);
        res.status(500).json({ message: 'Google Login Failed', error: err.message });
    }
};
