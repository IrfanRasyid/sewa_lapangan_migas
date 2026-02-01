const db = require('../src/config/db');

async function updateSchema() {
    try {
        console.log("Adding phone column to users table...");
        await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
        console.log("Column phone added (if it didn't exist).");
    } catch (err) {
        console.error("Error updating schema:", err);
    }
}

updateSchema();
