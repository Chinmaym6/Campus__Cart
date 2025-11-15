import pool from '../config/database.js';

const addProfileColumns = async () => {
  try {
    // Add profile columns to users table
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS profile_photo TEXT,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS student_id TEXT,
      ADD COLUMN IF NOT EXISTS student_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS social_facebook TEXT,
      ADD COLUMN IF NOT EXISTS social_instagram TEXT,
      ADD COLUMN IF NOT EXISTS social_twitter TEXT,
      ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Profile columns added to users table');
  } catch (error) {
    console.error('❌ Error adding profile columns:', error);
  } finally {
    pool.end();
  }
};

addProfileColumns();