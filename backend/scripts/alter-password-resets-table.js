import pool from '../config/database.js';

const alterPasswordResetsTable = async () => {
  try {
    await pool.query('ALTER TABLE password_resets RENAME COLUMN otp TO token');
    await pool.query('ALTER TABLE password_resets ALTER COLUMN token TYPE VARCHAR(255)');
    console.log('✅ Password resets table altered successfully');
  } catch (error) {
    console.error('❌ Error altering password resets table:', error);
  } finally {
    pool.end();
  }
};

alterPasswordResetsTable();