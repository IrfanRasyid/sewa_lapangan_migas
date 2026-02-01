const { Pool } = require('pg');
const dns = require('dns');
const util = require('util');
const url = require('url');

const lookup = util.promisify(dns.lookup);

let pool = null;

const initDB = async () => {
  if (pool) return pool;

  let connectionString = process.env.DATABASE_URL;
  let originalHostname = null;

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

  // IPv4 Force Resolution Logic (Custom Fix for Local DNS/Supabase issues)
  try {
            if (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://')) {
              const parsed = new url.URL(connectionString);
              originalHostname = parsed.hostname;
              const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(originalHostname);
              
              // Log what we found
              console.log(`DB Hostname: ${originalHostname} (IP: ${isIP})`);
              
              if (!isIP && originalHostname !== 'localhost') {
                console.log(`Resolving hostname ${originalHostname} to IPv4...`);
                try {
                  const { address } = await lookup(originalHostname, { family: 4 });
                  console.log(`Resolved ${originalHostname} to: ${address}`);
                  parsed.hostname = address;
                  connectionString = parsed.toString();
                } catch (e) {
                  console.error(`Failed to resolve ${originalHostname}, using original:`, e.message);
                }
              }
            }
          } catch (err) {
            console.error("DNS Resolution warning:", err.message);
          }
          
          const sniHost = process.env.DB_SNI_HOST || (originalHostname && originalHostname !== 'localhost' ? originalHostname : undefined);
          console.log(`Connecting with SNI: ${sniHost || 'Disabled'}`);

          pool = new Pool({
            connectionString,
            ssl: sniHost ? {
              rejectUnauthorized: false,
              servername: sniHost
            } : {
              rejectUnauthorized: false
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
