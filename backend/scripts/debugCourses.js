const { Course, sequelize } = require('../models');

async function listAllCourses() {
  try {
    console.log('Looking for all courses...');
    
    // Initialize database connection
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Get all courses
    const courses = await Course.findAll();
    
    console.log(`Found ${courses.length} courses:`);
    courses.forEach(course => {
      console.log(`ID: ${course.id}, Title: ${course.title}, Instructor ID: ${course.instructorId}`);
      console.log(`Thumbnail: ${course.thumbnail}`);
      console.log('-------------------');
    });
    
    if (courses.length === 0) {
      console.log('No courses found. Creating a test course...');
      
      // Create a test course
      const newCourse = await Course.create({
        title: 'Web Development Fundamentals',
        description: 'Learn HTML, CSS and JavaScript to build modern websites',
        level: 'beginner',
        category: 'web development',
        duration: '10 weeks',
        status: 'Open',
        imageUrl: '/uploads/courses/thumbnails/default-thumbnail.jpg',
        thumbnail: '/uploads/courses/thumbnails/default-thumbnail.jpg'
      });
      
      console.log('Created test course:', newCourse.id);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

listAllCourses(); 