require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const env = process.env.NODE_ENV || 'development';

function loadJsonConfig() {
  const configPath = path.join(__dirname, 'config.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    return require('./config.json')[env] || null;
  } catch {
    return null;
  }
}

const fileConfig = loadJsonConfig();

const dbConfig = {
  database:
    process.env.DB_NAME ||
    fileConfig?.database ||
    'CampusHUb',
  username:
    process.env.DB_USER ||
    fileConfig?.username ||
    'postgres',
  password:
    process.env.DB_PASSWORD ||
    process.env.DB_PASS ||
    fileConfig?.password ||
    '',
  host:
    process.env.DB_HOST ||
    fileConfig?.host ||
    '127.0.0.1',
  port: Number(
    process.env.DB_PORT ||
      fileConfig?.port ||
      5432,
  ),
  dialect: fileConfig?.dialect || 'postgres',
};

let sequelize;

if (env === 'test') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: { timestamps: true },
  });
} else {
  if (!dbConfig.password) {
    console.warn(
      '[db] No DB password set. Copy backend/config/config.example.json → config.json or set DB_PASSWORD in backend/.env',
    );
  }

  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    port: dbConfig.port,
    logging: env === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: { timestamps: true },
  });
}

const testConnection = async () => {
  if (env === 'test') return;
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

if (env !== 'test') {
  testConnection();
}

module.exports = sequelize;
