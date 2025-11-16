import pool from './config/database.js';
import fs from 'fs';

async function fixLocationColumns() {
  const client = await pool.connect();
  try {
    console.log('Starting migration to add location columns...');
    
    // Read and execute the SQL file
    const sql = fs.readFileSync('./config/fix-location-columns.sql', 'utf8');
    await client.query(sql);
    
    console.log('✓ Migration completed successfully!');
    console.log('✓ meetup_location and meetup_location_text columns added to items table');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixLocationColumns();
