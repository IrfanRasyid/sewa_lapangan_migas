
const { query, initDB } = require('../src/config/db');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const runMigration = async () => {
    console.log('Starting DB Migration for Google Auth...');
    try {
        await initDB();
        
        // 1. Add google_id column
        console.log('Adding google_id column...');
        await query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='google_id') THEN 
                    ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE; 
                END IF; 
            END $$;
        `);

        // 2. Make password nullable
        console.log('Altering password column to be nullable...');
        await query(`
            ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        `);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

runMigration();
