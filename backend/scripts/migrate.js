const { initDB } = require('../src/config/db');
const { createTables } = require('../src/models/schema');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

console.log('Pre-dotenv DATABASE_URL:', process.env.DATABASE_URL);

const rootEnvPath = path.join(__dirname, '../../.env');
const backendEnvPath = path.join(__dirname, '../.env');

console.log('Loading root .env from:', rootEnvPath);
if (fs.existsSync(rootEnvPath)) {
    console.log('Root .env content preview:', fs.readFileSync(rootEnvPath, 'utf8').substring(0, 100));
    dotenv.config({ path: rootEnvPath });
} else {
    console.log('Root .env not found');
}

console.log('Loading backend .env from:', backendEnvPath);
if (fs.existsSync(backendEnvPath)) {
    console.log('Backend .env content preview:', fs.readFileSync(backendEnvPath, 'utf8').substring(0, 100));
    dotenv.config({ path: backendEnvPath }); // This won't overwrite existing keys by default!
    // To overwrite, we might need to parse and assign manually, or clear env first.
    // But normally backend .env should have precedence if loaded second?
    // Actually dotenv.config DOES NOT overwrite existing keys.
    // The first one wins.
} else {
    console.log('Backend .env not found');
}

console.log('Post-dotenv DATABASE_URL:', process.env.DATABASE_URL);

const runMigration = async () => {
  console.log('Starting migration...');
  console.log('DATABASE_URL (masked):', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@') : 'Not Set');
  try {
    await initDB();
    await createTables();
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

runMigration();
