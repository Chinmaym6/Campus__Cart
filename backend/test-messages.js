import pool from './config/database.js';

async function testMessaging() {
  try {
    console.log('Testing messaging database setup...\n');

    // Test 1: Check if tables exist
    console.log('1. Checking tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('conversations', 'messages', 'message_templates')
      ORDER BY table_name
    `);
    console.log('✓ Found tables:', tables.rows.map(r => r.table_name));

    // Test 2: Check if items table has seller_id
    console.log('\n2. Checking items table...');
    const itemCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'items' AND column_name = 'seller_id'
    `);
    console.log('✓ seller_id column exists:', itemCols.rows.length > 0);

    // Test 3: Check if users table exists
    console.log('\n3. Checking users table...');
    const userCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY column_name
    `);
    console.log('✓ Users table columns:', userCols.rows.map(r => r.column_name));

    // Test 4: Try to get conversations
    console.log('\n4. Testing conversations query...');
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Fake UUID for testing
    const convQuery = `
      SELECT 
        c.id,
        c.item_id,
        c.buyer_id,
        c.seller_id,
        c.status,
        c.last_message_at,
        c.last_message_preview,
        c.created_at,
        c.updated_at,
        i.title as item_title,
        i.price as item_price,
        i.primary_photo_url as item_photo,
        i.status as item_status,
        CASE 
          WHEN c.buyer_id = $1 THEN c.unread_count_buyer
          ELSE c.unread_count_seller
        END as unread_count,
        CASE 
          WHEN c.buyer_id = $1 THEN c.seller_id
          ELSE c.buyer_id
        END as other_user_id
      FROM conversations c
      LEFT JOIN items i ON c.item_id = i.id
      WHERE (c.buyer_id = $1 OR c.seller_id = $1)
        AND c.status = 'active'
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    `;
    
    await pool.query(convQuery, [testUserId]);
    console.log('✓ Conversations query syntax is valid');

    // Test 5: Check message templates
    console.log('\n5. Checking message templates...');
    const templates = await pool.query('SELECT COUNT(*) as count FROM message_templates WHERE is_active = TRUE');
    console.log('✓ Active templates:', templates.rows[0].count);

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

testMessaging();
