import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Running saved_items table migration...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'config', 'add-saved-items.sql'),
      'utf8'
    );
    
    await client.query(sql);
    
    console.log('✓ Migration completed successfully!');
    console.log('✓ saved_items table created');
  } catch (error) {
    console.error('Error running migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n✓ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });
