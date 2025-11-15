import pool from '../config/database.js';

async function addCategories() {
  try {
    console.log('Adding default categories...');

    const insertQuery = `
      INSERT INTO categories (name, slug, sort_order) VALUES
        ('Books & Study Materials', 'books-study-materials', 1),
        ('Electronics', 'electronics', 2),
        ('Furniture', 'furniture', 3),
        ('Clothing & Accessories', 'clothing-accessories', 4),
        ('Sports & Recreation', 'sports-recreation', 5),
        ('Appliances', 'appliances', 6),
        ('Vehicles', 'vehicles', 7),
        ('Other', 'other', 8)
      ON CONFLICT (slug) DO NOTHING;
    `;

    await pool.query(insertQuery);

    console.log('✓ Categories added successfully');
  } catch (error) {
    console.error('✗ Failed to add categories:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addCategories();