const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const auth = require('../middleware/authMiddleware');
const isTeacher = require('../middleware/teacherMiddleware');
const { Course, Enrollment, User, CourseVideo } = require('../models');
const upload = require('../middleware/uploadMiddleware');
const {
  isYouTubeUrl,
  fetchVideoMeta,
  fetchPlaylistVideos,
} = require('../utils/youtube');

async function getOwnedCourse(courseId, userId) {
  return Course.findOne({ where: { id: courseId, instructorId: userId } });
}

async function addVideoToCourse(course, videoData) {
  const order = videoData.order ?? (await CourseVideo.count({ where: { courseId: course.id } })) + 1;
  const video = await CourseVideo.create({
    courseId: course.id,
    title: videoData.title,
    description: videoData.description || '',
    videoUrl: videoData.videoUrl,
    thumbnail: videoData.thumbnail || '',
    duration: videoData.duration || 0,
    order,
  });
  await Course.increment({ totalVideos: 1 }, { where: { id: course.id } });
  return video;
}

// Apply authentication middleware to all routes
router.use(auth);
// Apply teacher check middleware to all routes
router.use(isTeacher);

// Teacher profile routes
router.get('/profile', teacherController.getProfile);

// Dashboard and analytics routes
router.get('/stats', teacherController.getStats);
router.get('/analytics', teacherController.getAnalytics);

// Add a direct dashboard stats endpoint
router.get('/dashboard/stats', teacherController.getStats);

// Course management routes
router.get('/courses', teacherController.getCourses);
router.post('/courses', teacherController.uploadMiddleware.thumbnail, teacherController.createCourse);
router.get('/courses/:courseId/progress', teacherController.getCourseProgress);

// Delete a course
router.delete('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Courses use instructorId (user id), not teacherId
    const course = await Course.findOne({
      where: { id: courseId, instructorId: req.user.id }
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission' });
    }
    
    await course.destroy();
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Failed to delete course' });
  }
});

// Improved endpoint for adding videos to courses
router.post('/courses/:courseId/videos', upload.single('video'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    console.log(`[VIDEO UPLOAD] Received request for course ${courseId} from user ${userId}`);
    
    // Validate request
    if (!req.file) {
      console.log('[VIDEO UPLOAD] No file provided');
      return res.status(400).json({ message: 'No video file provided' });
    }
    
    if (!req.body.title) {
      console.log('[VIDEO UPLOAD] No title provided');
      req.body.title = 'Untitled Video';
    }
    
    // Log file information
    console.log(`[VIDEO UPLOAD] File information:`, {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
      mimetype: req.file.mimetype
    });
    
    // Check file type
    if (!req.file.mimetype.startsWith('video/')) {
      console.log(`[VIDEO UPLOAD] Invalid file type: ${req.file.mimetype}`);
      return res.status(400).json({ message: 'Uploaded file is not a video' });
    }
    
    // Create video entry in database
    try {
      const { CourseVideo, Course } = require('../models');
      
      // Course must belong to this instructor
      const course = await Course.findOne({
        where: { id: courseId, instructorId: userId }
      });
      if (!course) {
        console.log(`[VIDEO UPLOAD] Course ${courseId} not found or unauthorized for user ${userId}`);
        return res.status(404).json({ message: 'Course not found or you do not have permission' });
      }
      
      // Check if order is provided
      const order = req.body.order || 1;
      
      // Create the video in database
      const video = await CourseVideo.create({
        courseId,
        title: req.body.title,
        description: req.body.description || '',
        videoUrl: `/uploads/courses/videos/${req.file.filename}`,
        thumbnail: '/uploads/courses/thumbnails/default-thumbnail.jpg',
        duration: 0, // We would normally calculate this
        order
      });
      
      console.log(`[VIDEO UPLOAD] Video created with ID: ${video.id}`);
      
      // Update course video count
      try {
        await Course.increment({ totalVideos: 1 }, { where: { id: courseId } });
      } catch (updateError) {
        console.error('[VIDEO UPLOAD] Error updating course video count:', updateError);
      }
      
      // Return the created video
      return res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          id: video.id,
          title: video.title,
          description: video.description,
          videoUrl: video.videoUrl,
          thumbnail: video.thumbnail,
          duration: video.duration,
          order: video.order,
          createdAt: video.createdAt
        }
      });
      
    } catch (dbError) {
      console.error('[VIDEO UPLOAD] Database error:', dbError);
      return res.status(500).json({
        message: 'Failed to save video',
        error: dbError.message,
      });
    }
    
  } catch (error) {
    console.error('[VIDEO UPLOAD] Unhandled error:', error);
    return res.status(500).json({ 
      message: 'Server error during video upload',
      error: error.message
    });
  }
});

// Mirror a single YouTube video (no download — stores embed URL)
router.post('/courses/:courseId/videos/youtube', async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const { url, title, description, order } = req.body;

    if (!url || !isYouTubeUrl(url)) {
      return res.status(400).json({ message: 'A valid YouTube video URL is required' });
    }

    const course = await getOwnedCourse(courseId, userId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission' });
    }

    const meta = await fetchVideoMeta(url);
    const video = await addVideoToCourse(course, {
      title: title?.trim() || meta.title,
      description: description || '',
      videoUrl: meta.videoUrl,
      thumbnail: meta.thumbnail,
      duration: meta.duration,
      order,
    });

    return res.status(201).json({
      message: 'YouTube video linked successfully',
      video,
      source: 'youtube',
    });
  } catch (error) {
    console.error('[YOUTUBE VIDEO] Error:', error);
    return res.status(500).json({ message: error.message || 'Failed to add YouTube video' });
  }
});

// Import all videos from a YouTube playlist (requires YOUTUBE_API_KEY)
router.post('/courses/:courseId/videos/youtube-playlist', async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const { playlistUrl } = req.body;

    if (!playlistUrl || !isYouTubeUrl(playlistUrl)) {
      return res.status(400).json({ message: 'A valid YouTube playlist URL is required' });
    }

    const course = await getOwnedCourse(courseId, userId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission' });
    }

    const { videos } = await fetchPlaylistVideos(playlistUrl);
    const created = [];
    let order = await CourseVideo.count({ where: { courseId: course.id } });

    for (const item of videos) {
      order += 1;
      const video = await addVideoToCourse(course, {
        title: item.title,
        description: '',
        videoUrl: item.videoUrl,
        thumbnail: item.thumbnail,
        duration: item.duration,
        order,
      });
      created.push(video);
    }

    return res.status(201).json({
      message: `Imported ${created.length} videos from YouTube playlist`,
      count: created.length,
      videos: created,
      source: 'youtube-playlist',
    });
  } catch (error) {
    console.error('[YOUTUBE PLAYLIST] Error:', error);
    return res.status(500).json({ message: error.message || 'Failed to import playlist' });
  }
});

// Fetch videos for a course
router.get('/courses/:courseId/videos', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { CourseVideo } = require('../models');

    const videos = await CourseVideo.findAll({
      where: { courseId },
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });

    return res.status(200).json(videos);
  } catch (error) {
    console.error('[FETCH VIDEOS] Error:', error);
    return res.status(500).json({
      message: 'Failed to fetch course videos',
      error: error.message,
    });
  }
});

// Section routes — not implemented (no Section model yet)
router.post('/courses/:courseId/sections', async (req, res) => {
  return res.status(501).json({
    message: 'Course sections are not available yet. Upload videos directly to the course instead.'
  });
});

// Get enrolled students for a course
router.get('/courses/:id/students', auth, async (req, res) => {
  try {
    console.log(`Fetching enrolled students for course ${req.params.id}`);
    
    // Replace the problematic checkTeacherStatus call with direct teacher verification
    const userId = req.user.id;
    const courseId = req.params.id;
    
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
    
    // Log available user attributes
    const userAttributes = Object.keys(User.rawAttributes);
    console.log("Available User attributes:", userAttributes);
    
    // Get all enrollments with student information, using only attributes we're sure exist
    const enrollments = await Enrollment.findAll({
      where: { courseId },
      include: [
        {
        model: User,
        as: 'student',
          attributes: ['id', 'username', 'email'] // Only use fields we're sure exist
        }
      ]
    });
    
    console.log(`Found ${enrollments.length} enrollments for course ${courseId}`);
    
    // Format the response to match what the frontend expects
    const formattedEnrollments = enrollments.map(enrollment => {
      const student = enrollment.student || {};
      
      return {
        id: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        status: enrollment.status,
        enrollmentDate: enrollment.enrollmentDate,
        progress: enrollment.progress,
        grade: enrollment.grade,
        lastActivityDate: enrollment.lastActivityDate || enrollment.updatedAt,
        student: {
          id: student.id,
          username: student.username,
          email: student.email,
          // Fallbacks for fields that might not exist
          fullName: student.username || 'Student'
        }
      };
    });
    
    res.json(formattedEnrollments);
  } catch (error) {
    console.error(`Error fetching enrolled students:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 