require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('../config/config.json').development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: 'postgres',
  logging: false
});

const tables = [
  'Users', 'Teachers', 'Courses', 'CourseVideos', 'Enrollments',
  'StudentProgress', 'Posts', 'Comments', 'Likes', 'Stories',
  'Friends', 'FriendRequests', 'Messages', 'Chats', 'Notifications'
];

async function main() {
  await sequelize.authenticate();
  console.log('Database:', config.database, '\n');

  for (const table of tables) {
    try {
      const [[{ count }]] = await sequelize.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
      console.log(`${table.padEnd(18)} ${count} rows`);
    } catch (err) {
      console.log(`${table.padEnd(18)} (error: ${err.message})`);
    }
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

