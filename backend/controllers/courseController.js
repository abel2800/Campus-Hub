const { Op } = require('sequelize');
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sequelize = require('../config/database');
const CourseVideo = require('../models/CourseVideo');

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/courses/thumbnails');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, 'thumbnail-' + uniqueSuffix + fileExt);
  }
});

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for thumbnails!'), false);
    }
    cb(null, true);
  }
});

const courseController = {
    // Multer middleware for handling file uploads
    uploadMiddleware: upload.single('thumbnail'),

    // Get all courses
    getAllCourses: async (req, res) => {
        try {
            const courses = await Course.findAll({
                where: {
                    instructorId: { [Op.ne]: null },
                    [Op.or]: [
                        { status: { [Op.in]: ['Open', 'open', 'published', 'Published'] } },
                        { status: null },
                    ],
                },
                include: [
                    {
                        model: User,
                        as: 'instructor',
                        attributes: ['id', 'username', 'email'] 
                    }
                ],
                order: [['createdAt', 'DESC']] // Show newest courses first
            });
            
            // Process courses to remove enrollment count
            const processedCourses = courses.map(course => {
                const courseData = course.get({ plain: true });
                
                // Remove enrollment count
                if (courseData.hasOwnProperty('enrollmentCount')) {
                    delete courseData.enrollmentCount;
                }
                
                // Ensure thumbnails are set
                if (!courseData.thumbnail && !courseData.imageUrl) {
                    courseData.thumbnail = '/uploads/courses/thumbnails/default-thumbnail.jpg';
                    courseData.imageUrl = '/uploads/courses/thumbnails/default-thumbnail.jpg';
                }
                
                // Format instructor info
                if (courseData.instructor) {
                    courseData.teacherName = courseData.instructor.username;
                }
                
                return courseData;
            });
            
            console.log(`Fetched ${courses.length} courses`);
            res.json(processedCourses);
        } catch (error) {
            console.error('Error fetching all courses:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    // Add a new course
    createCourse: async (req, res) => {
        try {
            console.log('Creating new course with data:', req.body);
            console.log('Title received:', req.body.title, 'Length:', req.body.title?.length);
            console.log('Description received:', req.body.description, 'Length:', req.body.description?.length);
            
            // Validate required fields
            if (!req.body.title || req.body.title.trim() === '') {
                return res.status(400).json({ message: 'Course title is required' });
            }
            
            if (!req.body.description || req.body.description.trim() === '') {
                return res.status(400).json({ message: 'Course description is required' });
            }
            
            // Get file path if a thumbnail was uploaded
            let thumbnailPath = null;
            if (req.file) {
                thumbnailPath = `/uploads/courses/thumbnails/${req.file.filename}`;
                console.log('Thumbnail uploaded to:', thumbnailPath);
            }

            // Create the course with the provided data
            const courseData = {
                title: req.body.title,
                description: req.body.description,
                instructorId: req.instructorId || req.user?.id || req.body.instructorId || req.body.teacherId,
                level: req.body.level || 'beginner',
                category: req.body.category || 'programming',
                department: req.body.department || req.body.category?.charAt(0).toUpperCase() + req.body.category?.slice(1) || 'General',
                duration: req.body.duration ? String(req.body.duration) : '8 weeks',
                status: req.body.status || 'Open',
                totalVideos: req.body.totalVideos || 0,
                totalDuration: req.body.totalDuration || 0,
                enrollmentCount: 0,
                // Use the uploaded thumbnail or the default
                imageUrl: thumbnailPath || '/uploads/courses/thumbnails/default-thumbnail.jpg',
                thumbnail: thumbnailPath || '/uploads/courses/thumbnails/default-thumbnail.jpg',
                // Handle deadline both as expirationDate and deadline for compatibility
                expirationDate: req.body.deadline ? new Date(req.body.deadline) : null,
                deadline: req.body.deadline ? new Date(req.body.deadline) : null
            };
            
            // Validate required fields before creating course
            if (!courseData.title) {
                return res.status(400).json({ message: 'Course title is required' });
            }

            if (!courseData.description) {
                return res.status(400).json({ message: 'Course description is required' });
            }

            if (!courseData.instructorId) {
                return res.status(400).json({ message: 'Instructor ID is required' });
            }
            
            console.log('Final course data:', courseData);
            const course = await Course.create(courseData);
            
            console.log('Course created successfully:', course.id);
            res.status(201).json(course);
        } catch (error) {
            console.error('Error creating course:', error);
            res.status(500).json({ message: 'Error creating course', error: error.message });
        }
    },

    // Get a single course by ID
    getCourseById: async (req, res) => {
        try {
            const courseId = req.params.id;
            
            const course = await Course.findOne({
                where: { id: courseId },
                include: [
                    {
                        model: User,
                        as: 'instructor',
                        attributes: ['id', 'username', 'email'] // Only select fields we know exist
                    },
                    {
                        model: CourseVideo,
                        as: 'videos',
                        attributes: ['id', 'title', 'description', 'videoUrl', 'duration', 'order']
                    }
                ]
            });
            
            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }
            
            // Convert to a plain object we can modify
            const courseData = course.get({ plain: true });
            
            // Remove the enrollment count field if it exists
            if (courseData.hasOwnProperty('enrollmentCount')) {
                delete courseData.enrollmentCount;
            }
            
            res.json(courseData);
        } catch (error) {
            console.error('Error fetching course by ID:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    getEnrolledCourses: async (req, res) => {
        try {
            const userId = req.user.id;
            console.log(`Fetching enrolled courses for user ${userId}`);
            
            const courses = await Course.findAll({
                include: [
                    {
                        model: Enrollment,
                        where: { userId },
                        required: true
                    },
                    {
                        model: User,
                        as: 'instructor',
                        attributes: ['id', 'username', 'email']
                    }
                ]
            });
            
            // Process courses to include proper thumbnails and instructor info
            const processedCourses = courses.map(course => {
                const courseObj = course.toJSON();
                
                // Ensure thumbnails are set
                if (!courseObj.thumbnail && !courseObj.imageUrl) {
                    courseObj.thumbnail = '/uploads/courses/thumbnails/default-thumbnail.jpg';
                    courseObj.imageUrl = '/uploads/courses/thumbnails/default-thumbnail.jpg';
                }
                
                // Format instructor info
                if (courseObj.instructor) {
                    courseObj.teacherName = courseObj.instructor.username;
                }
                
                return courseObj;
            });
            
            console.log(`Found ${courses.length} enrolled courses for user ${userId}`);
            res.json(processedCourses);
        } catch (error) {
            console.error('Error fetching enrolled courses:', error);
            res.status(500).json({ message: 'Error fetching enrolled courses', error: error.message });
        }
    },

    enrollInCourse: async (req, res) => {
        try {
            const courseId = req.params.id;
            const userId = req.user.id;
            
            console.log(`User ${userId} attempting to enroll in course ${courseId}`);
            
            // Ensure the user is authenticated
            if (!userId) {
                console.error('Authentication required for enrollment');
                return res.status(401).json({ message: 'Authentication required' });
            }
            
            // Check if already enrolled
            const existingEnrollment = await Enrollment.findOne({
                where: { userId, courseId }
            });
            
            if (existingEnrollment) {
                console.log(`User ${userId} is already enrolled in course ${courseId}`);
                return res.status(400).json({ message: 'Already enrolled in this course' });
            }
            
            // Get course details
            const course = await Course.findByPk(courseId);
            
            if (!course) {
                console.log(`Course ${courseId} not found during enrollment attempt`);
                return res.status(404).json({ message: 'Course not found' });
            }
            
            // Create enrollment
            const enrollment = await Enrollment.create({
                userId,
                courseId,
                progress: 0,
                status: 'enrolled',
                enrollmentDate: new Date()
            });
            
            console.log(`Created enrollment for user ${userId} in course ${courseId}`);
            
            // Update the enrollment count for the course
            try {
                await Course.update(
                    { enrollmentCount: sequelize.literal('enrollmentCount + 1') },
                    { where: { id: courseId } }
                );
                console.log(`Updated enrollment count for course ${courseId}`);
            } catch (updateError) {
                console.error('Error updating enrollment count:', updateError);
                // Continue even if enrollment count update fails
            }
            
            // Create notification
            try {
                await Notification.create({
                    userId,
                    type: 'COURSE_ENROLLMENT',
                    content: `You have successfully enrolled in ${course.title}`,
                    read: false
                });
                console.log(`Created enrollment notification for user ${userId}`);
            } catch (notificationError) {
                console.error('Error creating notification:', notificationError);
                // Continue even if notification creation fails
            }
            
            res.status(201).json({ 
                message: 'Successfully enrolled in course',
                enrollment: {
                    id: enrollment.id,
                    courseId: enrollment.courseId,
                    userId: enrollment.userId,
                    enrollmentDate: enrollment.enrollmentDate,
                    status: enrollment.status
                }
            });
        } catch (error) {
            console.error('Error enrolling in course:', error);
            res.status(500).json({ message: 'Error enrolling in course', error: error.message });
        }
    },
    
    // Update a course
    updateCourse: async (req, res) => {
        try {
            const courseId = req.params.id;
            const userId = req.user?.id;
            console.log(`Updating course ${courseId} with data:`, req.body);
            
            // Check if course exists and belongs to this instructor
            const course = await Course.findOne({
                where: { id: courseId, instructorId: userId }
            });
            if (!course) {
                console.log(`Course ${courseId} not found or user ${userId} not authorized`);
                return res.status(404).json({ message: 'Course not found or you do not have permission' });
            }
            
            // Get file path if a new thumbnail was uploaded
            let thumbnailPath = course.imageUrl;
            if (req.file) {
                thumbnailPath = `/uploads/courses/thumbnails/${req.file.filename}`;
                console.log('New thumbnail uploaded to:', thumbnailPath);
            }

            // Update the course data (do not allow reassigning instructor via this endpoint)
            const updatedData = {
                title: req.body.title || course.title,
                description: req.body.description || course.description,
                level: req.body.level || course.level,
                category: req.body.category || course.category,
                duration: req.body.duration ? String(req.body.duration) : course.duration,
                status: req.body.status || course.status,
                imageUrl: thumbnailPath,
                thumbnail: thumbnailPath,
                expirationDate: req.body.deadline ? new Date(req.body.deadline) : course.expirationDate,
                deadline: req.body.deadline ? new Date(req.body.deadline) : course.deadline
            };
            
            console.log('Final updated course data:', updatedData);
            await course.update(updatedData);
            
            console.log(`Course ${courseId} updated successfully`);
            res.json({ message: 'Course updated successfully', course });
        } catch (error) {
            console.error('Error updating course:', error);
            res.status(500).json({ message: 'Error updating course', error: error.message });
        }
    },
    
    // Delete a course
    deleteCourse: async (req, res) => {
        try {
            const courseId = req.params.id;
            const userId = req.user?.id;
            console.log(`Deleting course ${courseId}`);
            
            const course = await Course.findOne({
                where: { id: courseId, instructorId: userId }
            });
            if (!course) {
                return res.status(404).json({ message: 'Course not found or you do not have permission' });
            }
            
            await course.destroy();
            
            console.log(`Course ${courseId} deleted successfully`);
            res.json({ message: 'Course deleted successfully' });
        } catch (error) {
            console.error('Error deleting course:', error);
            res.status(500).json({ message: 'Error deleting course', error: error.message });
        }
    }
};

module.exports = courseController; 