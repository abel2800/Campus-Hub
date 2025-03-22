'use strict';

const sequelize = require('../config/database');
const Sequelize = require('sequelize');

// Import models directly
const User = require('./User');
const Course = require('./Course');
const Post = require('./Post');
const Comment = require('./Comment');
const Like = require('./Like');
const Story = require('./Story');
const Message = require('./Message');
const Chat = require('./Chat');
const Friend = require('./Friend');
const FriendRequest = require('./FriendRequest');
const Notification = require('./Notification');
const Enrollment = require('./Enrollment');
const CourseVideo = require('./CourseVideo');
const Teacher = require('./Teacher');
const StudentProgress = require('./StudentProgress');

// Create a db object to export
const db = {
  User,
  Course,
  Post,
  Comment,
  Like,
  Story,
  Message,
  Chat,
  Friend,
  FriendRequest,
  Notification,
  Enrollment,
  CourseVideo,
  Teacher,
  StudentProgress,
  sequelize,
  Sequelize
};

// Check if all models are valid Sequelize models
const validateModel = (model, name) => {
  if (!model) {
    console.error(`Error: ${name} is not defined`);
    return false;
  }
  return true;
};

// Set up associations with error handling
try {
  // Post associations
  if (validateModel(User, 'User') && validateModel(Post, 'Post')) {
    User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
    Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }

  // Comment associations
  if (validateModel(User, 'User') && validateModel(Comment, 'Comment') && validateModel(Post, 'Post')) {
    User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
    Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
    Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
  }

  // Like associations
  if (validateModel(User, 'User') && validateModel(Like, 'Like') && validateModel(Post, 'Post')) {
    User.hasMany(Like, { foreignKey: 'userId', as: 'likes' });
    Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Post.hasMany(Like, { foreignKey: 'postId', as: 'likes' });
    Like.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
  }

  // Story associations
  if (validateModel(User, 'User') && validateModel(Story, 'Story')) {
    User.hasMany(Story, { foreignKey: 'userId', as: 'stories' });
    Story.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }

  // Friend associations
  if (validateModel(User, 'User') && validateModel(Friend, 'Friend') && validateModel(FriendRequest, 'FriendRequest')) {
    // Direct Friend associations for queries
    User.hasMany(Friend, { foreignKey: 'userId', as: 'userFriends' });
    Friend.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    User.hasMany(Friend, { foreignKey: 'friendId', as: 'friendsWithUser' });
    Friend.belongsTo(User, { foreignKey: 'friendId', as: 'friend' });
    
    // Direct FriendRequest associations for queries
    User.hasMany(FriendRequest, { foreignKey: 'senderId', as: 'sentFriendRequests' });
    FriendRequest.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
    
    User.hasMany(FriendRequest, { foreignKey: 'receiverId', as: 'receivedFriendRequests' });
    FriendRequest.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
    
    // Many-to-many associations through tables
    User.belongsToMany(User, { 
      through: Friend,
      as: 'friends',
      foreignKey: 'userId',
      otherKey: 'friendId'
    });

    User.belongsToMany(User, {
      through: FriendRequest,
      as: 'sentRequests',
      foreignKey: 'senderId',
      otherKey: 'receiverId'
    });

    User.belongsToMany(User, {
      through: FriendRequest,
      as: 'receivedRequests',
      foreignKey: 'receiverId',
      otherKey: 'senderId'
    });
  }

  // Course associations
  if (validateModel(User, 'User') && validateModel(Course, 'Course') && 
      validateModel(CourseVideo, 'CourseVideo') && validateModel(Enrollment, 'Enrollment')) {
    Course.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });
    User.hasMany(Course, { foreignKey: 'instructorId', as: 'createdCourses' });

    Course.hasMany(CourseVideo, { foreignKey: 'courseId', as: 'videos' });
    CourseVideo.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

    User.belongsToMany(Course, { 
      through: Enrollment,
      foreignKey: 'userId',
      as: 'enrolledCourses'
    });
    Course.belongsToMany(User, { 
      through: Enrollment,
      foreignKey: 'courseId',
      as: 'enrolledUsers'
    });

    Enrollment.belongsTo(User, { 
      foreignKey: 'userId', 
      as: 'student',
      attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'profileImage'] 
    });
    Enrollment.belongsTo(Course, { 
      foreignKey: 'courseId', 
      as: 'course',
      attributes: ['id', 'title', 'description', 'thumbnail'] 
    });
    User.hasMany(Enrollment, { foreignKey: 'userId', as: 'enrollments' });
    Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
    
    // Set up StudentProgress associations if the model exists
    if (validateModel(StudentProgress, 'StudentProgress')) {
      // StudentProgress belongs to User
      StudentProgress.belongsTo(User, { 
        foreignKey: 'userId',
        as: 'student'
      });
      User.hasMany(StudentProgress, { 
        foreignKey: 'userId',
        as: 'progressRecords'
      });
      
      // StudentProgress belongs to Course
      StudentProgress.belongsTo(Course, { 
        foreignKey: 'courseId'
      });
      Course.hasMany(StudentProgress, { 
        foreignKey: 'courseId',
        as: 'progressRecords'
      });
      
      // StudentProgress belongs to CourseVideo
      StudentProgress.belongsTo(CourseVideo, { 
        foreignKey: 'videoId',
        as: 'video'
      });
      CourseVideo.hasMany(StudentProgress, { 
        foreignKey: 'videoId',
        as: 'progressRecords'
      });
      
      // StudentProgress belongs to Enrollment (if it has an enrollmentId field)
      if (StudentProgress.rawAttributes.enrollmentId) {
        StudentProgress.belongsTo(Enrollment, {
          foreignKey: 'enrollmentId',
          as: 'enrollment'
        });
        Enrollment.hasMany(StudentProgress, {
          foreignKey: 'enrollmentId',
          as: 'progressRecords'
        });
      }
    }
  }

  // Message and notification associations
  if (validateModel(User, 'User') && validateModel(Message, 'Message') && validateModel(Notification, 'Notification')) {
    User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
    Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

    User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
    Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

    User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
    Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }
} catch (error) {
  console.error('Error setting up associations:', error.message);
}

// Export the db object
module.exports = db;