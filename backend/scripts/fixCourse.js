const { Course, sequelize } = require('../models');

async function fixCourse() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    console.log('Updating course with ID 11...');
    
    const result = await Course.update({
      title: 'Introduction to Programming',
      description: 'Learn the fundamentals of programming with hands-on exercises and projects',
      level: 'beginner',
      category: 'programming',
      duration: '8 weeks',
      status: 'Open',
      department: 'Computer Science',
      totalVideos: 12,
      totalDuration: 600, // 10 hours in minutes
    }, { 
      where: { id: 11 }
    });
    
    console.log('Update result:', result);
    
    // Verify the update
    const updatedCourse = await Course.findByPk(11);
    console.log('Updated course:', {
      id: updatedCourse.id,
      title: updatedCourse.title,
      description: updatedCourse.description.substring(0, 30) + '...',
      instructorId: updatedCourse.instructorId,
      thumbnail: updatedCourse.thumbnail
    });
    
    console.log('Course updated successfully!');
  } catch (error) {
    console.error('Error updating course:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

fixCourse(); 