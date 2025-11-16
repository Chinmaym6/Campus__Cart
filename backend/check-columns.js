import pool from './config/database.js';

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'items' 
        AND (column_name LIKE '%description%' OR column_name LIKE '%location%')
      ORDER BY column_name
    `);
    
    console.log('Columns related to location/description:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkColumns();
