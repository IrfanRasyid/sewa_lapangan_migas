const { Pool } = require('pg');
const dns = require('dns');
const util = require('util');
const url = require('url');

const lookup = util.promisify(dns.lookup);

let pool = null;

const initDB = async () => {
  if (pool) return pool;

  let connectionString = process.env.DATABASE_URL;

  // Fallback to individual variables if DATABASE_URL is not set
  if (!connectionString) {
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || '';
    const port = process.env.DB_PORT || '5432';
    const db = process.env.DB_NAME || 'postgres';
    
    // Check if we are using Supabase (sslmode=require is usually needed)
    const sslMode = process.env.DB_SSL_MODE || 'require';
    connectionString = `postgres://${user}:${password}@${host}:${port}/${db}?sslmode=${sslMode}`;
  }

  console.log("Initializing database connection...");

  // IPv4 Force Resolution Logic for Hugging Face / Docker environments
  try {
    // Handle "postgres://" and "postgresql://"
    if (!connectionString.startsWith('postgres://') && !connectionString.startsWith('postgresql://')) {
        // If it's a DSN string like "host=... user=...", we might need different parsing
        // For now, assume URL format is preferred or constructed above.
    } else {
        const parsed = new url.URL(connectionString);
        const hostname = parsed.hostname;
        
        // Check if it's already an IP
        const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
        
        if (!isIP && hostname !== 'localhost') {
            console.log(`Resolving hostname ${hostname} to IPv4...`);
            const { address } = await lookup(hostname, { family: 4 });
            console.log(`Resolved ${hostname} to: ${address}`);
            parsed.hostname = address;
            connectionString = parsed.toString();
        }
    }
  } catch (err) {
    console.error("DNS Resolution warning:", err.message);
    // Continue with original string if parsing fails
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Often required for hosted Postgres services
    }
  });

  // Test connection
  try {
    const client = await pool.connect();
    console.log('Database connected successfully!');
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }

  return pool;
};

module.exports = {
  query: async (text, params) => {
    if (!pool) await initDB();
    return pool.query(text, params);
  },
  initDB
};
