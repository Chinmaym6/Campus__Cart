import pool from './config/database.js';

async function alterEnum() {
  try {
    console.log('Altering item_status enum to include active...');
    await pool.query("ALTER TYPE item_status ADD VALUE 'active'");
    console.log('✓ Enum altered successfully');
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await pool.end();
  }
}

alterEnum();