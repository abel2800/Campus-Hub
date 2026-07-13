/**
 * This script generates random progress data for students enrolled in courses
 * It helps populate the StudentProgress table with realistic test data
 */

const { User, Course, CourseVideo, Enrollment, StudentProgress } = require('../models');
const sequelize = require('../config/database');

const generateProgressData = async () => {
  try {
    console.log('Starting to generate progress data...');
    
    // Get all enrollments
    const enrollments = await Enrollment.findAll({
      include: [
        {
          model: User,
          as: 'student'
        },
        {
          model: Course,
          as: 'course'
        }
      ]
    });
    
    console.log(`Found ${enrollments.length} enrollments to process`);
    
    for (const enrollment of enrollments) {
      const courseId = enrollment.courseId;
      const userId = enrollment.userId;
      const enrollmentId = enrollment.id;
      
      // Get all videos for this course
      const videos = await CourseVideo.findAll({
        where: { courseId }
      });
      
      console.log(`Processing ${videos.length} videos for enrollment ID ${enrollmentId}`);
      
      let totalProgress = 0;
      let completedVideos = 0;
      
      // For each video, create or update a progress record
      for (const video of videos) {
        // Generate random progress (0-100)
        const progress = Math.floor(Math.random() * 101);
        
        // Calculate random watch time (seconds)
        const durationInSeconds = video.durationInSeconds || 600; // Default 10 minutes
        const watchTimeSeconds = Math.floor((progress / 100) * durationInSeconds);
        
        // Set completion timestamp if progress is 100%
        const completedTimestamp = progress === 100 ? new Date() : null;
        
        if (progress === 100) {
          completedVideos++;
        }
        
        // Create or update progress record
        const [progressRecord, created] = await StudentProgress.findOrCreate({
          where: {
            userId,
            courseId,
            videoId: video.id
          },
          defaults: {
            enrollmentId,
            progress,
            watchTime: watchTimeSeconds,
            lastWatched: new Date(),
            completedTimestamp
          }
        });
        
        // If record already existed, update it
        if (!created) {
          await progressRecord.update({
            progress,
            watchTime: watchTimeSeconds,
            lastWatched: new Date(),
            completedTimestamp
          });
        }
        
        totalProgress += progress;
      }
      
      // Calculate average progress for the enrollment
      const averageProgress = videos.length ? Math.floor(totalProgress / videos.length) : 0;
      
      // Update the enrollment record
      await enrollment.update({
        progress: averageProgress,
        lastActivityDate: new Date(),
        status: averageProgress === 100 ? 'completed' : 'enrolled',
        completionDate: averageProgress === 100 ? new Date() : null
      });
      
      console.log(`Updated enrollment ID ${enrollmentId} with progress: ${averageProgress}%`);
    }
    
    console.log('Progress data generation completed successfully');
    
  } catch (error) {
    console.error('Error generating progress data:', error);
  } finally {
    process.exit();
  }
};

// Run the script
generateProgressData(); 