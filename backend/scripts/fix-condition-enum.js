import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function fixConditionEnum() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Check current enum values
    console.log('\n📋 Checking current enum values...');
    const enumCheck = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = 'item_condition'::regtype 
      ORDER BY enumsortorder
    `);
    
    console.log('Current enum values:');
    enumCheck.rows.forEach(row => {
      console.log('  ➜', row.enumlabel);
    });

    // Fix the enum
    console.log('\n🔧 Fixing enum...');
    
    // Step 1: Convert column to varchar
    console.log('Step 1: Converting column to varchar...');
    await client.query('ALTER TABLE items ALTER COLUMN condition TYPE varchar(50)');
    
    // Step 2: Drop old enum
    console.log('Step 2: Dropping old enum...');
    await client.query('DROP TYPE IF EXISTS item_condition CASCADE');
    
    // Step 3: Create new enum with correct values
    console.log('Step 3: Creating new enum...');
    await client.query(`
      CREATE TYPE item_condition AS ENUM (
        'brand_new', 
        'like_new', 
        'good', 
        'fair', 
        'for_parts'
      )
    `);
    
    // Step 4: Convert column back to enum
    console.log('Step 4: Converting column back to enum...');
    await client.query(`
      ALTER TABLE items 
      ALTER COLUMN condition TYPE item_condition 
      USING condition::item_condition
    `);
    
    // Verify
    console.log('\n✅ Verifying new enum values...');
    const newEnumCheck = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = 'item_condition'::regtype 
      ORDER BY enumsortorder
    `);
    
    console.log('New enum values:');
    newEnumCheck.rows.forEach(row => {
      console.log('  ✓', row.enumlabel);
    });
    
    console.log('\n✅ Enum fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
  } finally {
    await client.end();
  }
}

fixConditionEnum();
