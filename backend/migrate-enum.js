import pool from './config/database.js';

async function migrateEnum() {
  const client = await pool.connect();
  try {
    console.log('Starting enum migration...');
    
    console.log('Creating new enum type...');
    await client.query(`
      CREATE TYPE item_status_new AS ENUM ('draft', 'available', 'pending', 'sold', 'unavailable');
    `).catch(e => {
      if (!e.message.includes('already exists')) {
        throw e;
      }
      console.log('Note:', e.message);
    });
    
    console.log('Altering items table column...');
    await client.query(`
      ALTER TABLE items 
      ALTER COLUMN status DROP DEFAULT;
    `);
    
    await client.query(`
      ALTER TABLE items 
      ALTER COLUMN status TYPE item_status_new USING (
        CASE 
          WHEN status::text = 'active' THEN 'available'::item_status_new
          WHEN status::text = 'deleted' THEN 'unavailable'::item_status_new
          ELSE status::text::item_status_new
        END
      );
    `);
    
    await client.query(`
      ALTER TABLE items 
      ALTER COLUMN status SET DEFAULT 'draft';
    `);
    
    console.log('Dropping old enum...');
    await client.query('DROP TYPE item_status');
    
    console.log('Renaming new enum...');
    await client.query('ALTER TYPE item_status_new RENAME TO item_status');
    
    console.log('✓ Enum migration completed successfully');
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateEnum();
