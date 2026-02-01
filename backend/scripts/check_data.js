
const { Pool } = require('pg');

const connectionString = 'postgresql://postgres.pdfzkmkogmrwpjpxvkyu:lapgas61no28@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkData() {
  try {
    console.log("Connecting to DB...");
    const client = await pool.connect();
    console.log("Connected!");

    const users = await client.query('SELECT count(*) FROM users');
    console.log("Users count:", users.rows[0].count);
    
    const fields = await client.query('SELECT count(*) FROM fields');
    console.log("Fields count:", fields.rows[0].count);

    const bookings = await client.query('SELECT count(*) FROM bookings');
    console.log("Bookings count:", bookings.rows[0].count);
    
    if (users.rows[0].count > 0) {
        const userList = await client.query('SELECT id, email, name FROM users LIMIT 5');
        console.log("First 5 users:", userList.rows);
    }

    client.release();
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkData();
