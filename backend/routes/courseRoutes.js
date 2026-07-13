const express = require('express');
const router = express.Router();
const { Course, Enrollment, CourseVideo, User, Notification, StudentProgress } = require('../models');
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');
const isTeacher = require('../middleware/teacherMiddleware');
const sequelize = require('../config/database');

// IMPORTANT: Order matters for routes with parameters

// Get user enrolled courses
router.get('/user/enrolled', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching enrolled courses for user', userId);
    
    // First, check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Found user: ${user.username} (${user.id})`);
    
    // Find all enrollments for this user
    const enrollments = await Enrollment.findAll({
      where: { userId },
      raw: true
    });
    
    console.log(`Found ${enrollments.length} enrollments for user ${userId}:`, enrollments);
    
    if (!enrollments || enrollments.length === 0) {
      console.log('No enrollments found for user', userId);
      return res.json([]);
    }
    
    // Get the course IDs from the enrollments
    const courseIds = enrollments.map(enrollment => enrollment.courseId);
    console.log('Found enrollments for courses:', courseIds);
    
    try {
      // Fetch the courses separately
      const courses = await Course.findAll({
        where: { 
          id: courseIds 
        },
        include: [{
          model: CourseVideo,
          as: 'videos'
        }]
      });
      
      console.log(`Found ${courses.length} courses for user ${userId}`);
      
      // Add progress information from enrollments to courses
      const coursesWithProgress = courses.map(course => {
        const enrollment = enrollments.find(e => e.courseId === course.id);
        const courseData = course.toJSON();
        courseData.progress = enrollment ? enrollment.progress : 0;
        courseData.enrolledAt = enrollment ? enrollment.enrollmentDate : null;
        return courseData;
      });
      
      console.log(`Returning ${coursesWithProgress.length} courses with progress for user ${userId}`);
      res.json(coursesWithProgress);
    } catch (courseError) {
      console.error('Error fetching courses:', courseError);
      // If there's an error fetching courses, return the raw enrollments
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ message: 'Error fetching enrolled courses', error: error.toString() });
  }
});

// Get all teacher courses
router.get('/teacher', authMiddleware, async (req, res) => {
  try {
    const teacherId = req.user.id; // Assuming user ID matches teacher ID
    console.log('Fetching courses for teacher', teacherId);
    
    const courses = await Course.findAll({
      attributes: [
        'id', 'title', 'description', 'instructorId', 
        'imageUrl', 'thumbnail', 'duration', 'status',
        'department', 'level', 'totalVideos', 'totalDuration',
        'category', 'enrollmentCount', 'expirationDate', 
        'createdAt', 'updatedAt'
      ],
      where: { instructorId: teacherId },
      include: [{
          model: CourseVideo,
        as: 'videos'
      }],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${courses.length} courses for teacher ${teacherId}`);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    res.status(500).json({ message: 'Error fetching teacher courses', error: error.toString() });
  }
});

// Get recently created teacher courses
router.get('/teacher/recent', authMiddleware, async (req, res) => {
  try {
    const teacherId = req.user.id; // Assuming user ID matches teacher ID
    console.log('Fetching recent courses for teacher', teacherId);
    
    const courses = await Course.findAll({
      attributes: [
        'id', 'title', 'description', 'instructorId', 
        'imageUrl', 'thumbnail', 'duration', 'status',
        'department', 'level', 'totalVideos', 'totalDuration',
        'category', 'enrollmentCount', 'expirationDate', 
        'createdAt', 'updatedAt'
      ],
      where: { instructorId: teacherId },
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${courses.length} recent courses for teacher ${teacherId}`);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching recent teacher courses:', error);
    res.status(500).json({ message: 'Error fetching recent courses', error: error.toString() });
  }
});

// Get all courses
router.get('/', courseController.getAllCourses);

// Get course by ID
router.get('/:id', courseController.getCourseById);

// Enroll in a course
router.post('/:id/enroll', authMiddleware, courseController.enrollInCourse);

// Create a new course — teachers only
router.post('/', authMiddleware, isTeacher, courseController.uploadMiddleware, courseController.createCourse);

// Update a course
router.put('/:id', courseController.uploadMiddleware, courseController.updateCourse);

// Delete a course
router.delete('/:id', authMiddleware, courseController.deleteCourse);

// Upload a video for a course
router.post('/:id/videos', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description, videoUrl, thumbnail, duration, order } = req.body;
    
    console.log('Uploading video for course:', courseId, {
      title, 
      videoUrl: videoUrl ? 'provided' : 'missing',
      thumbnail: thumbnail ? 'provided' : 'missing'
    });
    
    // Validate required fields
    if (!title || !videoUrl) {
      return res.status(400).json({ message: 'Title and video URL are required' });
    }
    
    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Create the video record
    const video = await CourseVideo.create({
      courseId,
      title,
      description: description || '',
      videoUrl,
      thumbnail: thumbnail || '',
      duration: duration || 0,
      order: order || 0
    });
    
    console.log('Video uploaded successfully:', video.id);
    
    // Update the course total videos count
    const totalVideos = await CourseVideo.count({ where: { courseId } });
    await course.update({ totalVideos });
    
    res.status(201).json(video);
  } catch (error) {
    console.error('Error uploading course video:', error);
    res.status(500).json({ message: 'Error uploading course video', error: error.toString() });
  }
});

// Get videos for a specific course
router.get('/:id/videos', async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Fetching videos for course:', courseId);
    
    // Validate course ID
    if (!courseId || courseId === 'undefined') {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      console.log('Course not found with ID:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get videos for the course
    const videos = await CourseVideo.findAll({
      where: { courseId },
      order: [['order', 'ASC']] // Order by the 'order' field
    });
    
    console.log(`Found ${videos.length} videos for course ${courseId}`);
    res.json(videos);
  } catch (error) {
    console.error('Error fetching course videos:', error);
    res.status(500).json({ message: 'Error fetching course videos', error: error.toString() });
  }
});

// Add debug routes at the end
router.get('/debug/enrollments', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Debugging enrollments for user', userId);
    
    // Find all enrollments for this user
    const enrollments = await Enrollment.findAll({
      where: { userId },
      raw: true
    });
    
    console.log('Raw enrollments:', enrollments);
    
    // Find all courses
    const courses = await Course.findAll({
      raw: true
    });
    
    console.log('Available courses:', courses);
    
    // Map enrollments to include enrolledAt for frontend compatibility
    const mappedEnrollments = enrollments.map(enrollment => ({
      ...enrollment,
      enrolledAt: enrollment.enrollmentDate
    }));
    
    res.json({
      enrollments: mappedEnrollments,
      courses,
      userId
    });
  } catch (error) {
    console.error('Error debugging enrollments:', error);
    res.status(500).json({ message: 'Error debugging enrollments', error: error.toString() });
  }
});

router.get('/debug/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Debug user route accessed by user', userId);
    
    // Return basic user info
    res.json({
      userId,
      authenticated: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug user route:', error);
    res.status(500).json({ message: 'Error in debug route', error: error.toString() });
  }
});

// Add a debug route to check database tables
router.get('/debug/tables', async (req, res) => {
  try {
    // Get the table schema for Courses
    const [courseFields] = await sequelize.query(`SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Courses';`);
    
    // Get sample courses data
    const [courses] = await sequelize.query(`SELECT * FROM "Courses" LIMIT 5;`);
    
    res.json({
      courseFields,
      courses
    });
  } catch (error) {
    console.error('Error checking database schema:', error);
    res.status(500).json({ 
      message: 'Error checking database schema', 
      error: error.toString() 
    });
  }
});

// Get enrolled students for a specific course (for teachers)
router.get('/:id/enrollments', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    
    console.log(`User ${userId} requesting enrolled students for course ${courseId}`);
    
    // Verify the course exists and the teacher has rights to access it
    const course = await Course.findOne({
      where: { 
        id: courseId,
        instructorId: userId 
      }
    });
    
    if (!course) {
      console.log(`Course ${courseId} not found or user ${userId} not authorized to access`);
      return res.status(403).json({ message: 'You are not authorized to access enrollments for this course' });
    }
    
    // First, let's check what columns the User model has
    const userAttributes = Object.keys(User.rawAttributes);
    console.log("Available User attributes:", userAttributes);
    
    // Use only columns that actually exist in the User model
    const enrollments = await Enrollment.findAll({
      where: { courseId },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'username', 'email'] // Only include fields we know exist
      }],
      order: [['enrollmentDate', 'DESC']]
    });
    
    console.log(`Found ${enrollments.length} enrollments for course ${courseId}`);
    
    // Return formatted enrollment data
    const studentEnrollments = enrollments.map(enrollment => {
      const student = enrollment.student || {};
      
      return {
        id: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        enrollmentDate: enrollment.enrollmentDate,
        progress: enrollment.progress,
        status: enrollment.status,
        grade: enrollment.grade,
        lastActivityDate: enrollment.lastActivityDate || enrollment.updatedAt,
        student: {
          id: student.id,
          username: student.username,
          email: student.email,
          // Use fallbacks in case fields don't exist
          fullName: student.username || 'Student'
        }
      };
    });
    
    res.json(studentEnrollments);
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    res.status(500).json({ message: 'Error fetching course enrollments', error: error.toString() });
  }
});

// Unenroll from a course
router.delete('/:id/enroll', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    
    console.log(`User ${userId} attempting to unenroll from course ${courseId}`);
    
    // Check if enrolled
    const enrollment = await Enrollment.findOne({
      where: { userId, courseId }
    });
    
    if (!enrollment) {
      console.log(`User ${userId} is not enrolled in course ${courseId}`);
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Find course to update enrollment count
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Delete the enrollment
    await enrollment.destroy();
    console.log(`Deleted enrollment for user ${userId} in course ${courseId}`);
    
    // Update enrollment count
    if (course.enrollmentCount > 0) {
      await Course.update(
        { enrollmentCount: sequelize.literal('enrollmentCount - 1') },
        { where: { id: courseId } }
      );
      console.log(`Updated enrollment count for course ${courseId}`);
    }
    
    // Create notification
    try {
      await Notification.create({
        userId,
        type: 'COURSE_UNENROLLMENT',
        content: `You have been unenrolled from ${course.title}`,
        read: false
      });
      console.log(`Created unenrollment notification for user ${userId}`);
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue even if notification creation fails
    }
    
    res.json({ message: 'Successfully unenrolled from course' });
  } catch (error) {
    console.error('Error unenrolling from course:', error);
    res.status(500).json({ message: 'Error unenrolling from course', error: error.toString() });
  }
});

// Update student progress for a course
router.put('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    const { progress, videoId, lastCompletedTimestamp } = req.body;
    
    console.log(`Updating progress for user ${userId} in course ${courseId}: ${progress}%`);
    
    // Validate progress value
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Invalid progress value. Progress must be between 0 and 100.' });
    }
    
    // Find the enrollment
    const enrollment = await Enrollment.findOne({
      where: { userId, courseId }
    });
    
    if (!enrollment) {
      console.log(`No enrollment found for user ${userId} in course ${courseId}`);
      return res.status(404).json({ message: 'Enrollment not found. Please enroll in this course first.' });
    }
    
    // Update the enrollment with new progress
    await enrollment.update({
      progress: Math.max(enrollment.progress, progress), // Only update if new progress is higher
      status: progress >= 100 ? 'completed' : 'enrolled',
      updatedAt: new Date() // Update the last activity timestamp
    });
    
    // If videoId is provided, update or create a progress record for this specific video
    if (videoId) {
      // Check if we track individual video progress in the database
      if (sequelize.models.StudentProgress) {
        const [videoProgress, created] = await sequelize.models.StudentProgress.findOrCreate({
          where: { userId, courseId, videoId },
          defaults: {
            progress,
            lastWatched: new Date(),
            completedTimestamp: progress >= 100 ? new Date() : null
          }
        });
        
        if (!created) {
          // Only update if the new progress is higher
          if (progress > videoProgress.progress) {
            await videoProgress.update({
              progress,
              lastWatched: new Date(),
              completedTimestamp: progress >= 100 ? new Date() : null
            });
          }
        }
      }
    }
    
    // Get course total videos
    const course = await Course.findByPk(courseId);
    const totalVideos = course ? course.totalVideos || 0 : 0;
    
    // Calculate and return updated data
    const updatedEnrollment = await Enrollment.findOne({
      where: { userId, courseId },
      include: [{
        model: Course,
        as: 'course',
        attributes: ['title', 'totalVideos', 'totalDuration']
      }]
    });
    
    res.json({
      id: updatedEnrollment.id,
      progress: updatedEnrollment.progress,
      status: updatedEnrollment.status,
      lastActivity: updatedEnrollment.updatedAt,
      course: updatedEnrollment.course,
      grade: Math.floor(updatedEnrollment.progress) // Grade based on progress percentage
    });
  } catch (error) {
    console.error('Error updating course progress:', error);
    res.status(500).json({ message: 'Error updating course progress', error: error.toString() });
  }
});

// Get student progress for a specific course
router.get('/:id/students/:studentId/progress', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.params.studentId;
    const userId = req.user.id;
    
    console.log(`Fetching progress for student ${studentId} in course ${courseId}`);
    
    // Verify permissions (only the student or course instructor can view progress)
    const course = await Course.findByPk(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is the instructor or the student
    const isInstructor = course.instructorId === userId;
    const isStudent = String(studentId) === String(userId);
    
    if (!isInstructor && !isStudent) {
      console.log(`User ${userId} is not authorized to view progress for student ${studentId}`);
      return res.status(403).json({ message: 'You are not authorized to view this student\'s progress' });
    }
    
    // Check if the enrollment exists
    const enrollment = await Enrollment.findOne({
      where: { userId: studentId, courseId }
    });
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Student is not enrolled in this course' });
    }
    
    // Get all videos for the course
    const videos = await CourseVideo.findAll({
      where: { courseId },
      attributes: ['id', 'title', 'duration']
    });
    
    // Get progress data for each video if StudentProgress model exists
    let videoProgress = [];
    
    if (sequelize.models.StudentProgress) {
      // Fetch existing progress records
      const progressRecords = await sequelize.models.StudentProgress.findAll({
        where: { userId: studentId, courseId }
      });
      
      // Map progress to videos
      videoProgress = videos.map(video => {
        const progressRecord = progressRecords.find(p => p.videoId === video.id);
        
        return {
          videoId: video.id,
          title: video.title,
          progress: progressRecord ? progressRecord.progress : 0,
          lastWatched: progressRecord ? progressRecord.lastWatched : null,
          completedTimestamp: progressRecord ? progressRecord.completedTimestamp : null
        };
      });
    } else {
      // If no StudentProgress model, just return video IDs with 0 progress
      videoProgress = videos.map(video => ({
        videoId: video.id,
        title: video.title,
        progress: 0,
        lastWatched: null,
        completedTimestamp: null
      }));
    }
    
    // Return the progress data
    res.json(videoProgress);
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ message: 'Error fetching student progress', error: error.toString() });
  }
});

// Assign grade to a student
router.post('/:id/students/:studentId/grade', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.params.studentId;
    const teacherId = req.user.id;
    const { grade, enrollmentId } = req.body;
    
    console.log(`Teacher ${teacherId} assigning grade ${grade} to student ${studentId} in course ${courseId}`);
    
    // Verify the teacher is the instructor of the course
    const course = await Course.findOne({
      where: { 
        id: courseId,
        instructorId: teacherId 
      }
    });
    
    if (!course) {
      console.log(`Course ${courseId} not found or user ${teacherId} not authorized to grade students`);
      return res.status(403).json({ message: 'You are not authorized to assign grades for this course' });
    }
    
    // Find the enrollment to update
    let enrollment;
    if (enrollmentId) {
      enrollment = await Enrollment.findByPk(enrollmentId);
    } else {
      enrollment = await Enrollment.findOne({
        where: { userId: studentId, courseId }
      });
    }
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Student enrollment not found' });
    }
    
    // Update the enrollment with the grade
    await enrollment.update({
      grade: grade,
      updatedAt: new Date()
    });
    
    // Create a notification for the student
    try {
      await Notification.create({
        userId: studentId,
        type: 'GRADE_ASSIGNED',
        content: `Your grade for ${course.title} has been updated to ${grade}`,
        read: false
      });
    } catch (notificationError) {
      console.error('Error creating grade notification:', notificationError);
      // Continue even if notification creation fails
    }
    
    res.json({
      message: 'Grade assigned successfully',
      enrollment: {
        id: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        grade: enrollment.grade,
        progress: enrollment.progress,
        updatedAt: enrollment.updatedAt
      }
    });
  } catch (error) {
    console.error('Error assigning grade:', error);
    res.status(500).json({ message: 'Error assigning grade', error: error.toString() });
  }
});

/**
 * @route GET /api/courses/:id/students/:studentId/progress
 * @desc Get detailed progress for a student in a course
 * @access Private (Teacher/Student)
 */
router.get('/:id/students/:studentId/progress', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.params.studentId;
    const userId = req.user.id;

    // Find the course
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions - only the instructor or the student themselves can access this
    const isInstructor = course.instructorId === userId;
    const isStudent = parseInt(studentId) === userId;
    
    if (!isInstructor && !isStudent) {
      return res.status(403).json({ message: 'Not authorized to view this student\'s progress' });
    }

    // Verify the student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      where: {
        courseId,
        userId: studentId
      }
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Student not enrolled in this course' });
    }

    // Get all videos for the course
    const courseVideos = await CourseVideo.findAll({
      where: { courseId },
      attributes: ['id', 'title', 'duration', 'thumbnail']
    });

    // Get progress records for all videos
    const progressRecords = await StudentProgress.findAll({
      where: {
        courseId,
        userId: studentId
      },
      include: [
        {
          model: CourseVideo,
          as: 'video',
          attributes: ['id', 'title', 'duration']
        }
      ]
    });

    // Map progress data with video data to get a complete picture
    const videoProgress = courseVideos.map(video => {
      const progressRecord = progressRecords.find(p => p.videoId === video.id);
      return {
        videoId: video.id,
        title: video.title,
        duration: video.duration,
        thumbnail: video.thumbnail,
        progress: progressRecord ? progressRecord.progress : 0,
        lastWatched: progressRecord ? progressRecord.lastWatched : null,
        watchTime: progressRecord ? progressRecord.watchTime : 0,
        completed: progressRecord ? progressRecord.progress >= 100 : false
      };
    });

    // Calculate overall statistics
    const totalVideos = courseVideos.length;
    const completedVideos = videoProgress.filter(v => v.completed).length;
    const overallProgress = totalVideos > 0 
      ? Math.round((completedVideos / totalVideos) * 100) 
      : 0;

    // Update enrollment record if the calculated progress differs
    if (enrollment.progress !== overallProgress) {
      enrollment.progress = overallProgress;
      enrollment.lastActivityDate = new Date();
      if (overallProgress === 100 && enrollment.status !== 'completed') {
        enrollment.status = 'completed';
        enrollment.completionDate = new Date();
      }
      await enrollment.save();
    }

    res.json({
      enrollment: {
        id: enrollment.id,
        enrollmentDate: enrollment.enrollmentDate,
        lastActivity: enrollment.lastActivityDate,
        overallProgress,
        status: enrollment.status,
        grade: enrollment.grade
      },
      videoProgress
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 