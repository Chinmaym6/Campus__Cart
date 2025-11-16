import pool from './config/database.js';
import fs from 'fs';

async function addDescriptionColumns() {
  const client = await pool.connect();
  try {
    console.log('Adding description columns...');
    
    const sql = fs.readFileSync('./config/add-description-columns.sql', 'utf8');
    await client.query(sql);
    
    console.log('✓ location_description and meetup_description columns added');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addDescriptionColumns();
