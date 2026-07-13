const { Teacher } = require('../models');

/**
 * Middleware to check if the authenticated user is a teacher
 * This should be used after the auth middleware
 */
const isTeacher = async (req, res, next) => {
  try {
    // Check if user is authenticated and has an ID
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized - Not logged in' });
    }
    
    // Debug output
    console.log('Checking teacher status for user ID:', req.user.id);
    
    // Check if the Teacher model is properly imported
    if (!Teacher) {
      console.error('Teacher model not properly imported in teacherMiddleware');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Find teacher record for this user
    const teacher = await Teacher.findOne({
      where: { userId: req.user.id }
    });
    
    // Debug output for teacher record
    console.log('Teacher record for user ID', req.user.id, ':', teacher ? 'Found' : 'Not found');
    
    // If no teacher record found, deny access
    if (!teacher) {
      return res.status(403).json({ message: 'Access denied - Teacher privileges required' });
    }
    
    req.teacher = teacher;
    req.instructorId = teacher.userId;
    
    // User is a teacher, proceed to the next middleware/route
    next();
  } catch (error) {
    console.error('Error in teacher middleware:', error);
    res.status(500).json({ message: 'Internal server error checking teacher status' });
  }
};

module.exports = isTeacher; 