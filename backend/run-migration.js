import pool from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('Running database migrations...');
    
    const sqlFile = path.join(__dirname, 'config', 'add-saved-items.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await pool.query(sql);
    console.log('✓ saved_items table created successfully');
    
    const check = await pool.query("SELECT COUNT(*) FROM saved_items");
    console.log(`✓ Table verified: ${check.rows[0].count} rows`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
