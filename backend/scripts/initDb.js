const db = require('../models');
const bcrypt = require('bcrypt');

async function initializeDatabase() {
  try {
    // Sync all models with database
    await db.sequelize.sync({ force: true });
    console.log('Database tables created');

    // Create test user
    const hashedPassword = await bcrypt.hash('123456', 10);
    const user = await db.User.create({
      firstName: 'Abel',
      lastName: 'Sirak',
      username: 'abel2800',
      email: 'absir28@gmail.com',
      password: hashedPassword,
      department: 'Computer Science'
    });

    // Create test course
    const course = await db.Course.create({
      title: 'Introduction to Programming',
      description: 'Learn the basics of programming',
      department: 'Computer Science',
      instructorId: user.id
    });

    // Create test post
    const post = await db.Post.create({
      content: 'Welcome to CampusHub!',
      userId: user.id
    });

    console.log('Test data created successfully');
    console.log('You can now login with:');
    console.log('Email: absir28@gmail.com');
    console.log('Password: 123456');

    process.exit(0);
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

initializeDatabase(); 