require('dotenv').config();
const { Sequelize } = require('sequelize');

const ports = [5432, 5433];

async function checkPort(port) {
  console.log(`\n========== PORT ${port} ==========`);

  try {
    const admin = new Sequelize('postgres', 'postgres', process.env.DB_PASSWORD || process.env.DB_PASS || '', {
      host: '127.0.0.1',
      port,
      dialect: 'postgres',
      logging: false
    });

    await admin.authenticate();
    console.log('Connected OK');

    const [dbs] = await admin.query(`
      SELECT datname FROM pg_database
      WHERE datistemplate = false
      ORDER BY datname;
    `);

    console.log('Databases:');
    for (const { datname } of dbs) {
      const campus = /campus/i.test(datname) ? ' *** CAMPUS ***' : '';
      console.log(`  - ${datname}${campus}`);
    }

    const campusNames = dbs.filter((d) => /campus/i.test(d.datname)).map((d) => d.datname);

    for (const dbName of campusNames) {
      const db = new Sequelize(dbName, 'postgres', process.env.DB_PASSWORD || process.env.DB_PASS || '', {
        host: '127.0.0.1',
        port,
        dialect: 'postgres',
        logging: false
      });

      const [tables] = await db.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);

      console.log(`\n  Tables in "${dbName}" (${tables.length}):`);
      if (tables.length === 0) {
        console.log('    (NONE - empty database)');
      } else {
        tables.forEach((t) => console.log(`    - ${t.table_name}`));
      }
      await db.close();
    }

    await admin.close();
  } catch (err) {
    console.log('Cannot connect:', err.message);
  }
}

async function main() {
  for (const port of ports) {
    await checkPort(port);
  }
}

main();

