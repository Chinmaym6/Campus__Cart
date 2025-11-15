import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function addMissingColumns() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD) || '',
    database: process.env.DB_NAME || 'Campus__Cart'
  });

  try {
    console.log('Adding missing columns to items table...');

    const sqlPath = path.join(__dirname, '../config/add-missing-columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
        console.log('✓ Executed:', statement.trim().substring(0, 50) + '...');
      }
    }

    console.log('✓ All missing columns added successfully');
  } catch (error) {
    console.error('✗ Failed to add columns:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addMissingColumns();
