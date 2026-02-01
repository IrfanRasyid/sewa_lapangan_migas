
const { Pool } = require('pg');

const connectionString = 'postgresql://postgres.pdfzkmkogmrwpjpxvkyu:lapgas61no28@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const fieldsData = [
  {
    name: 'Lapangan Badminton',
    type: 'Badminton',
    price_per_hour: 35000,
    image_url: 'https://images.unsplash.com/photo-1626224583764-84786c713664?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Lapangan badminton indoor dengan pencahayaan standar turnamen.'
  }
];

async function seedFields() {
  try {
    console.log("Connecting to DB...");
    const client = await pool.connect();
    console.log("Connected! Seeding fields...");

    // Delete existing fields to avoid duplicates or inconsistent data
    await client.query('DELETE FROM bookings'); // Delete bookings first due to FK
    await client.query('DELETE FROM fields');
    
    // Reset sequence if needed (optional but good for clean IDs)
    // await client.query('ALTER SEQUENCE fields_id_seq RESTART WITH 1');

    for (const field of fieldsData) {
      const query = `
        INSERT INTO fields (name, type, price_per_hour, image_url, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name;
      `;
      const values = [field.name, field.type, field.price_per_hour, field.image_url, field.description];
      
      const res = await client.query(query, values);
      console.log(`Inserted: ${res.rows[0].name} (ID: ${res.rows[0].id})`);
    }

    console.log("Seeding completed successfully.");
    client.release();
  } catch (err) {
    console.error("Error seeding fields:", err);
  } finally {
    await pool.end();
  }
}

seedFields();
