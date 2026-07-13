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
  console.log(`Connected: port ${config.port}, database "${config.database}"`);

  const [tables] = await sequelize.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  console.log(`\nTables (${tables.length}):`);
  tables.forEach((t, i) => console.log(`  ${i + 1}. ${t.tablename}`));

  await sequelize.close();
}

main();

