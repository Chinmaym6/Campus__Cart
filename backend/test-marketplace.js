import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testMarketplace() {
  console.log('\n🧪 TESTING MARKETPLACE DATA\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Check if items table exists
    console.log('\n1️⃣  Checking items table...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'items'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ items table does not exist!');
      return;
    }
    console.log('✅ items table exists');
    
    // Test 2: Count total items
    console.log('\n2️⃣  Counting items...');
    const totalCount = await pool.query('SELECT COUNT(*) FROM items WHERE deleted_at IS NULL');
    console.log(`   Total items (not deleted): ${totalCount.rows[0].count}`);
    
    // Test 3: Count by status
    console.log('\n3️⃣  Items by status:');
    const statusCount = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM items
      WHERE deleted_at IS NULL
      GROUP BY status
      ORDER BY count DESC
    `);
    
    statusCount.rows.forEach(row => {
      const icon = row.status === 'available' ? '✅' : row.status === 'draft' ? '📝' : '⚠️';
      console.log(`   ${icon} ${row.status}: ${row.count}`);
    });
    
    // Test 4: Check for items without location
    console.log('\n4️⃣  Location data:');
    const locationStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE location IS NOT NULL) as with_location,
        COUNT(*) FILTER (WHERE location IS NULL) as without_location
      FROM items
      WHERE deleted_at IS NULL
    `);
    
    console.log(`   ✅ With location: ${locationStats.rows[0].with_location}`);
    console.log(`   ⚠️  Without location: ${locationStats.rows[0].without_location}`);
    
    // Test 5: Sample items
    console.log('\n5️⃣  Sample available items:');
    const sampleItems = await pool.query(`
      SELECT 
        id,
        title,
        price,
        status,
        CASE 
          WHEN location IS NOT NULL THEN 'Yes'
          ELSE 'No'
        END as has_location,
        created_at
      FROM items
      WHERE status = 'available' AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (sampleItems.rows.length === 0) {
      console.log('   ⚠️  No available items found!');
      console.log('   💡 Make sure you have items with status = \'available\'');
    } else {
      sampleItems.rows.forEach((item, idx) => {
        console.log(`\n   ${idx + 1}. ${item.title}`);
        console.log(`      Price: $${item.price}`);
        console.log(`      Status: ${item.status}`);
        console.log(`      Location: ${item.has_location}`);
        console.log(`      Created: ${new Date(item.created_at).toLocaleDateString()}`);
      });
    }
    
    // Test 6: Check categories
    console.log('\n6️⃣  Checking categories...');
    const categoriesCount = await pool.query('SELECT COUNT(*) FROM categories WHERE is_active = true');
    console.log(`   ✅ Active categories: ${categoriesCount.rows[0].count}`);
    
    // Test 7: Check users
    console.log('\n7️⃣  Checking users...');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`   ✅ Total users: ${usersCount.rows[0].count}`);
    
    // Test 8: Check saved_items table
    console.log('\n8️⃣  Checking saved_items table...');
    const savedTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'saved_items'
      );
    `);
    
    if (savedTableCheck.rows[0].exists) {
      console.log('   ✅ saved_items table exists');
      const savedCount = await pool.query('SELECT COUNT(*) FROM saved_items');
      console.log(`   📌 Saved items: ${savedCount.rows[0].count}`);
    } else {
      console.log('   ⚠️  saved_items table does not exist');
      console.log('   💡 Run: node run-saved-items-migration.js');
    }
    
    // Test 9: Test browse query
    console.log('\n9️⃣  Testing browse query...');
    const browseQuery = `
      SELECT 
        i.*,
        c.name as category_name,
        u.first_name as seller_first_name,
        u.last_name as seller_last_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN users u ON i.seller_id = u.id
      WHERE i.status = 'available' AND i.deleted_at IS NULL
      LIMIT 5
    `;
    
    const browseResult = await pool.query(browseQuery);
    console.log(`   ✅ Browse query returned: ${browseResult.rows.length} items`);
    
    if (browseResult.rows.length === 0) {
      console.log('\n⚠️  WARNING: No items will show in marketplace!');
      console.log('   Reasons:');
      console.log('   1. No items have status = \'available\'');
      console.log('   2. All items are deleted (deleted_at IS NOT NULL)');
      console.log('\n   💡 Solution:');
      console.log('   UPDATE items SET status = \'available\' WHERE id = \'your-item-id\';');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SUMMARY\n');
    
    const availableItems = parseInt(statusCount.rows.find(r => r.status === 'available')?.count || '0');
    
    if (availableItems > 0) {
      console.log(`✅ ${availableItems} items ready to show in marketplace!`);
    } else {
      console.log('❌ No items available for marketplace');
      console.log('\n💡 NEXT STEPS:');
      console.log('   1. Make sure you have created items');
      console.log('   2. Set their status to \'available\'');
      console.log('   3. Run this test again');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error testing marketplace:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testMarketplace();
