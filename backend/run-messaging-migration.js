import pool from './config/database.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    try {
        // Run the SQL to create tables
        const createTablesSQL = fs.readFileSync(
            join(__dirname, 'config/create-messaging-tables.sql'),
            'utf8'
        );

        // Execute the entire SQL file at once
        await pool.query(createTablesSQL);

        console.log('✓ Messaging tables created successfully.');
        console.log('✓ Default message templates inserted.');

        process.exit(0);
    } catch (error) {
        console.error('Error running migration:', error);
        process.exit(1);
    }
}

runMigration();