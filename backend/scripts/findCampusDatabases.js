require('dotenv').config();
const { Sequelize } = require('sequelize');

async function main() {
  const admin = new Sequelize('postgres', 'postgres', process.env.DB_PASSWORD || process.env.DB_PASS || '', {
    host: '127.0.0.1',
    port: 5432,
    dialect: 'postgres',
    logging: false
  });

  await admin.authenticate();

  const [dbs] = await admin.query(`
    SELECT datname
    FROM pg_database
    WHERE datistemplate = false
      AND datname ILIKE '%campus%'
    ORDER BY datname;
  `);

  console.log('Campus-related databases:\n');

  for (const { datname } of dbs) {
    const db = new Sequelize(datname, 'postgres', process.env.DB_PASSWORD || process.env.DB_PASS || '', {
      host: '127.0.0.1',
      port: 5432,
      dialect: 'postgres',
      logging: false
    });

    const [tables] = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`Database: "${datname}"`);
    console.log(`  Tables (${tables.length}): ${tables.length ? tables.map(t => t.table_name).join(', ') : '(none)'}`);
    console.log('');
    await db.close();
  }

  await admin.close();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

