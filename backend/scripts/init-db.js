import fs from 'fs';
import path from 'path';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const initializeDatabase = async () => {
  try {
    const sqlPath = path.join(process.cwd(), 'config', 'init-db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Initializing database...');
    await pool.query(sql);
    console.log('✓ Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    process.exit(1);
  }
};

initializeDatabase();
