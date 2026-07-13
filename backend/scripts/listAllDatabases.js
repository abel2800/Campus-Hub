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
    SELECT datname, oid
    FROM pg_database
    WHERE datistemplate = false
    ORDER BY datname;
  `);

  console.log('ALL databases on this server:\n');
  for (const { datname } of dbs) {
    const marker = /campus/i.test(datname) ? '  <-- CAMPUS DB' : '';
    console.log(`  "${datname}"${marker}`);
  }

  console.log('\n--- Checking campus-related DBs for tables ---\n');

  const campusDbs = dbs.filter((d) => /campus/i.test(d.datname));

  for (const { datname } of campusDbs) {
    const db = new Sequelize(datname, 'postgres', process.env.DB_PASSWORD || process.env.DB_PASS || '', {
      host: '127.0.0.1',
      port: 5432,
      dialect: 'postgres',
      logging: false
    });

    const [tables] = await db.query(`
      SELECT COUNT(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);

    console.log(`Database "${datname}" => ${tables[0].count} tables`);
    await db.close();
  }

  await admin.close();
}

main().catch((e) => { console.error(e.message); process.exit(1); });

