import pool from '../config/database.js';

const createPasswordResetsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Password resets table created successfully');
  } catch (error) {
    console.error('❌ Error creating password resets table:', error);
  } finally {
    pool.end();
  }
};

createPasswordResetsTable();