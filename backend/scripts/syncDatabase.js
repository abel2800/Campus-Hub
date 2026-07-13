/**
 * Creates/updates all Sequelize tables in the campushub database.
 * Run: node scripts/syncDatabase.js
 */
require('dotenv').config();
const db = require('../models');

async function syncDatabase() {
  try {
    await db.sequelize.authenticate();
    console.log('Connected to database:', db.sequelize.config.database);

    console.log('\nSyncing all models (creating missing tables)...');
    await db.sequelize.sync({ alter: true, force: false });
    console.log('Sync complete.\n');

    const [tables] = await db.sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`Tables in public schema (${tables.length}):`);
    tables.forEach((row, i) => {
      console.log(`  ${String(i + 1).padStart(2)}. ${row.table_name}`);
    });

    console.log('\n--- Run this in pgAdmin Query Tool to verify ---');
    console.log(`SELECT table_name FROM information_schema.tables`);
    console.log(`WHERE table_schema = 'public' ORDER BY table_name;`);

    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error.message);
    process.exit(1);
  }
}

syncDatabase();
