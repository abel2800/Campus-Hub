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
  const [info] = await sequelize.query('SELECT current_database(), current_user, current_schema();');
  console.log('Connected as:', info[0]);

  const [tables] = await sequelize.query(`
    SELECT schemaname, tablename, tableowner
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename;
  `);

  console.log('\nAll user tables in pg_catalog:');
  tables.forEach((t) => console.log(`  ${t.schemaname}.${t.tablename} (owner: ${t.tableowner})`));

  await sequelize.close();
}

main();

