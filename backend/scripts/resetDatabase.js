const sequelize = require('../config/database');

async function resetDatabase() {
  try {
    console.log('Dropping all tables...');
    await sequelize.drop();
    console.log('All tables dropped successfully');
    
    console.log('Syncing database...');
    await sequelize.sync({ force: true });
    console.log('Database synced successfully');
    
    console.log('Database reset complete');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase(); 