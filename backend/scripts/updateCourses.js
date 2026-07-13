const sequelize = require('../config/database');
const { Course, User } = require('../models');

async function updateCourses() {
  try {
    // First, find a user to be the default instructor
    const defaultUser = await User.findOne();
    
    if (!defaultUser) {
      console.error('No users found to set as default instructor');
      process.exit(1);
    }
    
    // Update all courses to have this instructor
    await sequelize.query(`
      UPDATE "Courses" 
      SET "instructorId" = ${defaultUser.id}
      WHERE "instructorId" IS NULL
    `);
    
    console.log('All courses updated with default instructor');
    process.exit(0);
  } catch (error) {
    console.error('Error updating courses:', error);
    process.exit(1);
  }
}

updateCourses(); 