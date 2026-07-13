const { Teacher, Course, User, CourseVideo, StudentProgress, Enrollment, sequelize } = require('../models');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = '';
    
    if (file.fieldname === 'thumbnail') {
      uploadPath = path.join(__dirname, '../uploads/courses/thumbnails');
    } else if (file.fieldname === 'video') {
      uploadPath = path.join(__dirname, '../uploads/courses/videos');
    }
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB file size limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
      // Accept only images for thumbnails
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed for thumbnails!'), false);
      }
    } else if (file.fieldname === 'video') {
      // Accept only videos
      if (!file.mimetype.startsWith('video/')) {
        return cb(new Error('Only video files are allowed!'), false);
      }
    }
    cb(null, true);
  }
});

const teacherController = {
  // Multer middleware for handling file uploads
  uploadMiddleware: {
    thumbnail: upload.single('thumbnail'),
    video: upload.single('video'),
  },

  // Get teacher profile
  getProfile: async (req, res) => {
    try {
      const teacher = await Teacher.findOne({
        where: { userId: req.user.id },
        include: [{
          model: User,
          as: 'user',
          attributes: ['username', 'email', 'avatar']
        }]
      });
      
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }
      
      res.json(teacher);
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      res.status(500).json({ message: 'Error fetching teacher profile' });
    }
  },

  // Get teacher's courses
  getCourses: async (req, res) => {
    try {
      const instructorId = req.instructorId || req.user.id;
      const courses = await Course.findAll({
        where: { instructorId },
        include: [{
          model: CourseVideo,
          as: 'videos'
        }]
      });
      
      // Format the courses for the frontend
      const formattedCourses = await Promise.all(courses.map(async (course) => {
        const enrolledCount = await Enrollment.count({
          where: { courseId: course.id }
        });
        
        return {
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail ? `/uploads/courses/thumbnails/${course.thumbnail}` : null,
          imageUrl: course.imageUrl,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          totalVideos: course.videos ? course.videos.length : 0,
          enrolledStudents: enrolledCount,
          category: course.category,
          level: course.level,
          duration: course.duration,
          expirationDate: course.expirationDate
        };
      }));
      
      res.json(formattedCourses);
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
      res.status(500).json({ message: 'Error fetching courses' });
    }
  },

  // Create a new course
  createCourse: async (req, res) => {
    try {
      const { title, description, category, level, duration, expirationDate } = req.body;
      
      // Validate required fields
      if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
      }
      
      // Get thumbnail file path if uploaded
      const thumbnailPath = req.file ? req.file.filename : null;
      
      // Create the course
      const instructorId = req.instructorId || req.user.id;
      const course = await Course.create({
        title,
        description,
        instructorId,
        thumbnail: thumbnailPath,
        category,
        level,
        duration,
        status: 'Open',
        expirationDate: expirationDate ? new Date(expirationDate) : null
      });
      
      // Return the created course with formatted data
      res.status(201).json({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail ? `/uploads/courses/thumbnails/${course.thumbnail}` : null,
        category: course.category,
        level: course.level,
        duration: course.duration,
        expirationDate: course.expirationDate,
        createdAt: course.createdAt
      });
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({ message: 'Error creating course' });
    }
  },

  // Add a video to a course
  addCourseVideo: async (req, res) => {
    try {
      const { courseId } = req.params;
      const { title, description, order } = req.body;
      
      console.log(`Adding video to course ${courseId}:`, { title });
      
      // Validate required fields
      if (!title || !req.file) {
        return res.status(400).json({ message: 'Title and video file are required' });
      }
      
      // Verify the course belongs to this teacher
      const instructorId = req.instructorId || req.user.id;
      const course = await Course.findOne({
        where: { id: courseId, instructorId }
      });
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found or you do not have permission' });
      }
      
      // Get the video file extension
      const fileExt = path.extname(req.file.filename);
      const isVideo = fileExt === '.mp4' || fileExt === '.webm';
      
      // Create a thumbnail for the video using ffmpeg (optional for production)
      const thumbnailFilename = `thumbnail-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
      const thumbnailPath = `/uploads/courses/thumbnails/${thumbnailFilename}`;
      
      // Calculate the video duration using ffmpeg (in a real implementation)
      // Here we're using a mock duration between 10-60 minutes for demo
      const duration = Math.floor(Math.random() * 50) + 10;
      
      // Save to the CourseVideo model
      const video = await CourseVideo.create({
        courseId,
        title,
        description,
        videoUrl: `/uploads/courses/videos/${req.file.filename}`,
        thumbnail: thumbnailPath,
        duration: duration * 60, // Convert to seconds
        order: order || (await CourseVideo.count({ where: { courseId } })) + 1
      });
      
      // Update the course's total videos count and total duration
      await Course.update(
        { 
          totalVideos: sequelize.literal('totalVideos + 1'),
          totalDuration: sequelize.literal(`totalDuration + ${duration * 60}`)
        },
        { where: { id: courseId } }
      );
      
      console.log(`Video added to course ${courseId}:`, video.id);
      
      res.status(201).json({
        id: video.id,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnail: video.thumbnail,
        duration: video.duration,
        order: video.order,
        createdAt: video.createdAt
      });
    } catch (error) {
      console.error('Error adding course video:', error);
      res.status(500).json({ message: 'Error adding video to course', error: error.message });
    }
  },

  // Get student progress for a specific course
  getCourseProgress: async (req, res) => {
    try {
      const { courseId } = req.params;
      
      // Verify the course belongs to this teacher
      const instructorId = req.instructorId || req.user.id;
      const course = await Course.findOne({
        where: { id: courseId, instructorId }
      });
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found or you do not have permission' });
      }
      
      const progress = await StudentProgress.findAll({
        where: { courseId },
        include: [{
          model: User,
          as: 'student',
          attributes: ['id', 'username', 'email', 'avatar']
        }]
      });
      
      // Format the progress data for frontend
      const formattedProgress = progress.map(p => ({
        id: p.id,
        studentId: p.studentId,
        studentName: p.student ? p.student.username : 'Unknown',
        courseId: p.courseId,
        progress: p.progressPercentage,
        lastVideoId: p.lastWatchedVideoId,
        lastActive: p.updatedAt,
        videosWatched: p.completedVideos
      }));
      
      res.json(formattedProgress);
    } catch (error) {
      console.error('Error fetching course progress:', error);
      res.status(500).json({ message: 'Error fetching progress' });
    }
  },

  // Get analytics data for the teacher dashboard
  getAnalytics: async (req, res) => {
    try {
      const instructorId = req.instructorId || req.user.id;
      const courses = await Course.findAll({
        where: { instructorId }
      });
      
      // Course engagement analytics
      const courseEngagement = await Promise.all(courses.map(async (course) => {
        const enrollments = await Enrollment.count({
          where: { courseId: course.id }
        });
        
        const progress = await StudentProgress.findAll({
          where: { courseId: course.id }
        });
        
        const avgProgress = progress.length > 0 
          ? progress.reduce((sum, p) => sum + p.progressPercentage, 0) / progress.length 
          : 0;
        
        return {
          courseId: course.id,
          courseName: course.title,
          totalStudents: enrollments,
          averageProgress: Math.round(avgProgress)
        };
      }));
      
      // Student progress across all courses
      const studentProgress = await StudentProgress.findAll({
        where: { 
          courseId: { [sequelize.Op.in]: courses.map(c => c.id) } 
        },
        include: [
          {
            model: User,
            as: 'student',
            attributes: ['id', 'username', 'email']
          },
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title']
          }
        ],
        limit: 20, // Limit to recent progress entries
        order: [['updatedAt', 'DESC']]
      });
      
      const formattedStudentProgress = studentProgress.map(p => ({
        id: p.id,
        studentId: p.studentId,
        studentName: p.student ? p.student.username : 'Unknown',
        courseId: p.courseId,
        courseName: p.course ? p.course.title : 'Unknown Course',
        progress: p.progressPercentage,
        lastActive: p.updatedAt
      }));
      
      res.json({
        courseEngagement,
        studentProgress: formattedStudentProgress
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Error fetching analytics data' });
    }
  },

  // Get teacher statistics for dashboard
  getStats: async (req, res) => {
    try {
      // Count all courses by this teacher
      const instructorId = req.instructorId || req.user.id;
      const totalCourses = await Course.count({
        where: { instructorId }
      });

      // Get all course IDs by this teacher
      const courses = await Course.findAll({
        where: { instructorId },
        attributes: ['id', 'rating']
      });
      
      const courseIds = courses.map(c => c.id);
      
      // Count all enrollments across all courses
      const totalStudents = courseIds.length > 0 ? await Enrollment.count({
        where: { courseId: { [sequelize.Op.in]: courseIds } }
      }) : 0;
      
      // Calculate average rating across all courses
      let averageRating = 0;
      if (courses.length > 0) {
        const totalRating = courses.reduce((sum, course) => sum + (course.rating || 0), 0);
        averageRating = totalRating / courses.length;
      }
      
      res.json({
        totalCourses,
        totalStudents,
        averageRating: parseFloat(averageRating.toFixed(1))
      });
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      res.status(500).json({ message: 'Error fetching statistics' });
    }
  }
};

module.exports = teacherController; 