const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const friendRoutes = require('./routes/friendRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const courseRoutes = require('./routes/courseRoutes');
const postRoutes = require('./routes/postRoutes');
const storyRoutes = require('./routes/storyRoutes');
const jwt = require('jsonwebtoken');
const { Course, CourseVideo } = require('./models');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const postsDir = path.join(uploadsDir, 'posts');
const storiesDir = path.join(uploadsDir, 'stories');
const coursesDir = path.join(uploadsDir, 'courses');
const coursesVideosDir = path.join(coursesDir, 'videos');
const coursesThumbnailsDir = path.join(coursesDir, 'thumbnails');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Created uploads directory');
}
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir);
  console.log('Created posts directory');
}
if (!fs.existsSync(storiesDir)) {
  fs.mkdirSync(storiesDir);
  console.log('Created stories directory');
}
if (!fs.existsSync(coursesDir)) {
  fs.mkdirSync(coursesDir);
  console.log('Created courses directory');
}
if (!fs.existsSync(coursesVideosDir)) {
  fs.mkdirSync(coursesVideosDir);
  console.log('Created course videos directory');
}
if (!fs.existsSync(coursesThumbnailsDir)) {
  fs.mkdirSync(coursesThumbnailsDir);
  console.log('Created course thumbnails directory');
}

// Create a default thumbnail for videos if it doesn't exist
const defaultThumbnailPath = path.join(coursesThumbnailsDir, 'default-thumbnail.jpg');
if (!fs.existsSync(defaultThumbnailPath)) {
  try {
    // Create an empty file as placeholder
    fs.writeFileSync(defaultThumbnailPath, '');
    console.log('Created default thumbnail placeholder');
  } catch (err) {
    console.error('Error creating default thumbnail:', err);
  }
}

// Also add this to serve static files - update this line to serve from both directories
app.use('/uploads', [
  express.static(path.join(__dirname, 'public/uploads')),
  express.static(path.join(__dirname, 'uploads'))
]);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/teacher', require('./routes/teacherRoutes'));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Authenticate socket connection
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      
      // Join a room specific to this user
      socket.join(`user:${userId}`);
      console.log(`User ${userId} authenticated and joined their room`);
      
      // Handle private messages
      socket.on('private-message', (data) => {
        const { recipientId, message } = data;
        io.to(`user:${recipientId}`).emit('private-message', {
          senderId: userId,
          message
        });
      });
    } catch (error) {
      console.error('Socket authentication error:', error);
    }
  }
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Function to send notification to a user
const sendNotification = (userId, notification) => {
  io.to(`user:${userId}`).emit('notification', notification);
};

// Make sendNotification available globally
global.sendNotification = sendNotification;

// Make io accessible to our router
app.io = io;

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Function to seed initial courses
async function seedInitialCourses() {
  try {
    // Check if courses already exist
    const courseCount = await Course.count();
    
    if (courseCount > 0) {
      console.log('Courses already exist, skipping seed');
      return;
    }
    
    console.log('Seeding initial courses...');
    
    // Create sample courses
    const coursesToCreate = [
      {
        title: 'Introduction to C Programming',
        description: 'Learn the fundamentals of C programming language, including syntax, data types, control structures, and more.',
        instructor: 'John Doe',
        imageUrl: '/uploads/courses/thumbnails/default-thumbnail.jpg',
        thumbnail: '/uploads/courses/thumbnails/default-thumbnail.jpg',
        duration: '8 weeks',
        status: 'Open',
        department: 'Computer Science',
        level: 'Beginner',
        totalVideos: 12,
        totalDuration: 720
      },
      {
        title: 'Digital Image Processing',
        description: 'Explore techniques for manipulating and analyzing digital images using computer algorithms.',
        instructor: 'Emily Chen',
        imageUrl: '/uploads/courses/thumbnails/default-thumbnail.jpg',
        thumbnail: '/uploads/courses/thumbnails/default-thumbnail.jpg',
        duration: '10 weeks',
        status: 'Open',
        department: 'Computer Vision',
        level: 'Intermediate',
        totalVideos: 15,
        totalDuration: 900
      },
      {
        title: 'Java Programming',
        description: 'Master Java programming with hands-on projects and exercises covering OOP concepts and application development.',
        instructor: 'Michael Johnson',
        imageUrl: '/uploads/courses/thumbnails/default-thumbnail.jpg',
        thumbnail: '/uploads/courses/thumbnails/default-thumbnail.jpg',
        duration: '12 weeks',
        status: 'Open',
        department: 'Software Engineering',
        level: 'Intermediate',
        totalVideos: 20,
        totalDuration: 1200
      },
      {
        title: 'Python Programming',
        description: 'Learn how to use Python for data analysis, visualization, and machine learning applications.',
        instructor: 'Sarah Williams',
        imageUrl: '/uploads/courses/thumbnails/default-thumbnail.jpg',
        thumbnail: '/uploads/courses/thumbnails/default-thumbnail.jpg',
        duration: '10 weeks',
        status: 'Open',
        department: 'Data Science',
        level: 'Intermediate',
        totalVideos: 18,
        totalDuration: 1080
      },
      {
        title: 'Software Engineering',
        description: 'Study software development methodologies, design patterns, and best practices for building robust applications.',
        instructor: 'David Brown',
        imageUrl: '/uploads/courses/thumbnails/default-thumbnail.jpg',
        thumbnail: '/uploads/courses/thumbnails/default-thumbnail.jpg',
        duration: '14 weeks',
        status: 'Open',
        department: 'Software Engineering',
        level: 'Advanced',
        totalVideos: 25,
        totalDuration: 1500
      }
    ];

    const createdCourses = [];
    for (const courseData of coursesToCreate) {
      const course = await Course.create(courseData);
      createdCourses.push(course);
    }
    
    console.log('Initial courses seeded successfully');
    
    // After creating courses, seed the videos
    await seedCourseVideos(createdCourses);
    
  } catch (error) {
    console.error('Error seeding courses:', error);
  }
}

// Function to seed course videos from public folder
async function seedCourseVideos(courses) {
  try {
    // Check if videos already exist
    const videoCount = await CourseVideo.count();
    
    if (videoCount > 0) {
      console.log('Course videos already exist, skipping seed');
      return;
    }
    
    const publicPath = path.join(__dirname, '../frontend/public/courses');
    
    // Map of course folders to course IDs
    const courseFolderMap = {
      'c': courses.find(c => c.title.includes('C Programming'))?.id,
      'dip': courses.find(c => c.title.includes('Digital Image'))?.id,
      'java': courses.find(c => c.title.includes('Java'))?.id,
      'python': courses.find(c => c.title.includes('Python'))?.id,
      'software': courses.find(c => c.title.includes('Software'))?.id
    };
    
    // Create sample videos for each course
    for (const [folder, courseId] of Object.entries(courseFolderMap)) {
      if (!courseId) continue;
      
      const coursePath = path.join(publicPath, folder);
      
      // Check if the course folder exists
      if (!fs.existsSync(coursePath)) {
        console.log(`Course folder ${folder} does not exist, skipping`);
        continue;
      }
      
      // Get all files in the course folder
      const files = fs.readdirSync(coursePath);
      
      // Filter for video files
      const videoFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp4', '.webm', '.mov', '.avi'].includes(ext);
      });
      
      // Create video entries for each video file
      for (let i = 0; i < videoFiles.length; i++) {
        const videoFile = videoFiles[i];
        const videoPath = `/courses/${folder}/${videoFile}`;
        
        await CourseVideo.create({
          courseId: courseId,
          title: `${folder.charAt(0).toUpperCase() + folder.slice(1)} Lesson ${i + 1}`,
          description: `This is lesson ${i + 1} of the ${folder} course.`,
          videoUrl: videoPath,
          thumbnail: `/courses/${folder}/thumbnail.jpg`,
          duration: Math.floor(Math.random() * 300) + 300, // Random duration between 300-600 seconds
          order: i + 1
        });
      }
      
      // If no video files were found, create a placeholder video
      if (videoFiles.length === 0) {
        await CourseVideo.create({
          courseId: courseId,
          title: `Introduction to ${folder.charAt(0).toUpperCase() + folder.slice(1)}`,
          description: `This is an introduction to the ${folder} course.`,
          videoUrl: `/courses/${folder}/thumbnail.jpg`, // Use thumbnail as placeholder
          thumbnail: `/courses/${folder}/thumbnail.jpg`,
          duration: 300,
          order: 1
        });
      }
    }
    
    console.log('Course videos seeded successfully');
  } catch (error) {
    console.error('Error seeding course videos:', error);
  }
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    
    // Sync models with database
    return sequelize.sync({ alter: true, force: false })
      .then(() => {
        console.log('Database models synchronized successfully');
        // Additional initialization if needed
      })
      .catch(err => {
        console.error('Failed to synchronize database models:', err);
      });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });