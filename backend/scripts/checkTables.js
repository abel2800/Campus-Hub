require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('../config/config.json').development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: 'postgres',
  logging: false
});

async function main() {
  await sequelize.authenticate();
  console.log('Connected to database:', config.database);

  const [tables] = await sequelize.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  console.log('\nExisting tables (' + tables.length + '):');
  if (tables.length === 0) {
    console.log('  (none)');
  } else {
    tables.forEach((row) => console.log('  -', row.table_name));
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

