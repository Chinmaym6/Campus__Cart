import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function createMessagingTables() {
  const client = await pool.connect();
  
  try {
    console.log('Creating messaging tables...');
    
    const sqlFile = path.join(__dirname, '../config/create-messaging-tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await client.query(sql);
    
    console.log('✓ Messaging tables created successfully!');
    console.log('✓ Default message templates inserted!');
    
  } catch (error) {
    console.error('Error creating messaging tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createMessagingTables();