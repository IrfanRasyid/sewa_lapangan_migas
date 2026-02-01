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

// Initialize DB
initDB().then(() => {
    createTables().catch(err => console.error('Table creation failed:', err));
}).catch(err => console.error('DB Init failed:', err));

// Export for Vercel
module.exports = app;

// Conditional Listen for Local Dev
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
