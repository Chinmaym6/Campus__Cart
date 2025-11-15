import pg from 'pg';

const adminPool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '935391',
  database: 'postgres'
});

const dbName = process.env.DB_NAME || 'Campus__Cart';

(async () => {
  try {
    console.log(`Creating database "${dbName}"...`);
    
    await adminPool.query(`
      SELECT 1 FROM pg_database WHERE datname = '${dbName}'
    `, async (err, res) => {
      if (err) {
        console.error('✗ Error checking database:', err.message);
        process.exit(1);
      }

      if (res && res.rows.length > 0) {
        console.log(`✓ Database "${dbName}" already exists`);
        await adminPool.end();
        process.exit(0);
      }

      adminPool.query(`CREATE DATABASE "${dbName}"`, async (createErr) => {
        if (createErr) {
          console.error('✗ Error creating database:', createErr.message);
          await adminPool.end();
          process.exit(1);
        }

        console.log(`✓ Database "${dbName}" created successfully`);
        await adminPool.end();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('✗ Unexpected error:', error.message);
    process.exit(1);
  }
})();
