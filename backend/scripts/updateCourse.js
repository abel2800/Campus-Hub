const { Course } = require('../models');

async function updateUndefinedCourse() {
  try {
    console.log('Starting course update...');
    
    // Find the course with undefined title
    const undefinedCourse = await Course.findOne({ where: { title: 'undefined' } });
    if (!undefinedCourse) {
      console.log('No course with "undefined" title found.');
      return;
    }
    
    console.log('Found course to update:', undefinedCourse.id);
    
    // Update the course
    const result = await Course.update({
      title: 'Introduction to Programming',
      description: 'Learn the basics of programming with this comprehensive course',
      level: 'beginner',
      category: 'programming',
      duration: '8 weeks',
      status: 'Open'
    }, { 
      where: { id: undefinedCourse.id }
    });
    
    console.log('Update result:', result);
    console.log('Course updated successfully!');
  } catch (error) {
    console.error('Error updating course:', error);
  } finally {
    process.exit();
  }
}

updateUndefinedCourse(); 