import pool from './config/database.js';

async function checkEnum() {
  try {
    const res = await pool.query("SELECT enum_range(NULL::item_status) as values");
    console.log('Current enum values:', res.rows[0].values);
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkEnum();