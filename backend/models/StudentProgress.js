const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentProgress = sequelize.define('StudentProgress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Courses',
      key: 'id'
    }
  },
  videoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'CourseVideos',
      key: 'id'
    }
  },
  enrollmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Enrollments',
      key: 'id'
    }
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  lastWatched: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completedTimestamp: {
    type: DataTypes.DATE,
    allowNull: true
  },
  watchTime: {
    type: DataTypes.INTEGER, // Seconds watched
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'StudentProgress',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'courseId', 'videoId']
    },
    {
      fields: ['enrollmentId']
    }
  ]
});

// Associate with other models
StudentProgress.associate = (models) => {
  // StudentProgress belongs to User
  if (models.User) {
    StudentProgress.belongsTo(models.User, { 
      foreignKey: 'userId',
      as: 'student'
    });
  }
  
  // StudentProgress belongs to Course
  if (models.Course) {
    StudentProgress.belongsTo(models.Course, { 
      foreignKey: 'courseId'
    });
  }
  
  // StudentProgress belongs to CourseVideo
  if (models.CourseVideo) {
    StudentProgress.belongsTo(models.CourseVideo, { 
      foreignKey: 'videoId',
      as: 'video'
    });
  }
  
  // StudentProgress belongs to Enrollment
  if (models.Enrollment) {
    StudentProgress.belongsTo(models.Enrollment, {
      foreignKey: 'enrollmentId',
      as: 'enrollment'
    });
  }
};

module.exports = StudentProgress; 