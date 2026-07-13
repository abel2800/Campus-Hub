const sequelize = require('../config/database');

// Global test setup
before(async function() {
  this.timeout(10000); // Increase timeout for database operations
  
  try {
    // Sync database with force: true to recreate tables
    await sequelize.sync({ force: true });
    console.log('Global test database synchronized');
    
    // Create test users that the JWT tokens reference
    const { User } = require('../models');
    
    // Create test user with ID 1 (for auth tests and social tests)
    await User.create({
      id: 1,
      username: 'Test User',
      email: 'test@example.com',
      password: '$2b$10$BS3u5GHbFXW8M.RbmC6nqubC0GrorWT5aOYLGnmr4k8SABe6DJ80u', // password123 hashed with bcrypt
      department: 'Computer Science',
      role: 'student'
    });
    
    // Create test user with ID 2 (for course tests)
    await User.create({
      id: 2,
      username: 'Test Student',
      email: 'student@example.com',
      password: '$2b$10$BS3u5GHbFXW8M.RbmC6nqubC0GrorWT5aOYLGnmr4k8SABe6DJ80u', // password123 hashed with bcrypt
      department: 'Computer Science',
      role: 'student'
    });
    
    // Create test teacher with ID 3
    await User.create({
      id: 3,
      username: 'Test Teacher',
      email: 'teacher@example.com',
      password: '$2b$10$BS3u5GHbFXW8M.RbmC6nqubC0GrorWT5aOYLGnmr4k8SABe6DJ80u', // password123 hashed with bcrypt
      department: 'Computer Science',
      role: 'teacher'
    });
    
    console.log('Test users created successfully');
    
    // Reset the auto-increment sequence to avoid conflicts
    await sequelize.query("SELECT setval(pg_get_serial_sequence('\"Users\"', 'id'), (SELECT MAX(id) FROM \"Users\"));");
    
  } catch (error) {
    console.error('Global database sync error:', error);
    throw error;
  }
});

// Global test cleanup
after(async function() {
  this.timeout(5000);
  
  try {
    // Close database connection
    await sequelize.close();
    console.log('Global test database connection closed');
  } catch (error) {
    console.error('Global database close error:', error);
  }
});

module.exports = sequelize; 