import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addItemsTables() {
  try {
    console.log('Adding items and categories tables...');

    const sqlPath = path.join(__dirname, '../config/add-items-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);

    console.log('✓ Items and categories tables added successfully');
  } catch (error) {
    console.error('✗ Failed to add tables:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addItemsTables();