const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { initDB } = require('./config/db');
const { createTables } = require('./models/schema');

dotenv.config();

const app = express();
// Port is handled by Vercel or environment
const PORT = process.env.PORT || 7860;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
// Note: In serverless, writing to disk is ephemeral. Uploads won't persist.
// We should use Supabase Storage ideally, but for now we keep the route to avoid breaking.
// It will only work for files uploaded in the same request or if we use /tmp (not exposed via static).
// For Vercel, we need a real storage solution.
// But let's keep the code running first.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes (Importing)
const authRoutes = require('./routes/authRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.send('Sewa Lapangan Backend is running (Node.js on Vercel)');
});

// Health Check & DB Test Endpoint
app.get('/api/health', async (req, res) => {
    try {
        const { initDB } = require('./config/db');
        const pool = await initDB();
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            status: 'ok', 
            message: 'Database connected', 
            time: result.rows[0].now,
            env: {
                google_client_id: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
                db_url: process.env.DATABASE_URL ? 'Set' : 'Missing'
            }
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Database connection failed', 
            error: err.message,
            stack: err.stack
        });
    }
});

// Migration Endpoint (Temporary)
app.get('/api/migrate', async (req, res) => {
    try {
        const { query, initDB } = require('./config/db');
        await initDB();
        
        // 1. Add google_id column
        await query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='google_id') THEN 
                    ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE; 
                END IF; 
            END $$;
        `);

        // 2. Make password nullable
        await query(`
            ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        `);

        // 3. Seed Admin User (Idempotent)
        // Check if admin exists
        const adminCheck = await query("SELECT * FROM users WHERE email = 'admin@lapangan.com'");
        let adminMsg = 'Admin already exists.';
        
        if (adminCheck.rows.length === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 8);
            await query(
                "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
                ['Admin', 'admin@lapangan.com', hashedPassword, 'admin']
            );
            adminMsg = 'Admin user created (admin@lapangan.com / admin123).';
        }

        res.json({ message: `Migration executed successfully. ${adminMsg}` });
    } catch (err) {
        res.status(500).json({ message: 'Migration failed', error: err.message });
    }
});

// Export for Vercel
module.exports = app;

// Conditional Listen for Local Dev
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
