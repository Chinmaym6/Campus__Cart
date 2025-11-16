import pool from './config/database.js';

async function checkAllColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'items'
      ORDER BY column_name
    `);
    
    console.log('All columns in items table:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check specifically for trade and open_to_trades
    console.log('\n--- Trade-related columns:');
    const tradeColumns = result.rows.filter(r => 
      r.column_name.includes('trade') || r.column_name === 'open_to_trades'
    );
    tradeColumns.forEach(row => {
      console.log(`  ✓ ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAllColumns();
