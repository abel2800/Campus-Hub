const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    instructorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
     
        comment: 'ID of the teacher who created this course'
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Path to the course thumbnail image'
    },
    duration: {
        type: DataTypes.STRING,
        comment: 'Course duration in weeks',
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true
    },
    level: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'beginner'
    },
    totalVideos: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    totalDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'other',
        comment: 'Course category (e.g. programming, design, business)'
    },
    enrollmentCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    expirationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date when the course expires'
    },
    deadline: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Course deadline date'
    }
}, {
    timestamps: true,
    tableName: 'Courses'
});

// Define associations
Course.associate = function(models) {
    // Association with Teacher model
    Course.belongsTo(models.Teacher, {
        foreignKey: 'instructorId',
        as: 'teacher'
    });
    
    // Association with User model for instructor
    Course.belongsTo(models.User, {
        foreignKey: 'instructorId',
        as: 'instructor'
    });

    // Association with CourseVideo model
    if (models.CourseVideo) {
        Course.hasMany(models.CourseVideo, {
            foreignKey: 'courseId',
            as: 'videos'
        });
    }

    // Association with Section model
    if (models.Section) {
        Course.hasMany(models.Section, {
            foreignKey: 'courseId',
            as: 'sections'
        });
    }

    // Association with Enrollment model for students
    if (models.Enrollment) {
        Course.hasMany(models.Enrollment, {
            foreignKey: 'courseId',
            as: 'enrollments'
        });
    }

    // Association with StudentProgress model
    if (models.StudentProgress) {
        Course.hasMany(models.StudentProgress, {
            foreignKey: 'courseId',
            as: 'studentProgress'
        });
    }
};

module.exports = Course; 