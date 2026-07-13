require('dotenv').config();

/** Sequelize CLI config — prefers env vars, never commit real passwords. */
const shared = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'CampusHUb',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  dialect: 'postgres',
  logging: false,
};

module.exports = {
  development: { ...shared },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: { ...shared },
};
