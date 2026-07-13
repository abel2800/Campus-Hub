const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Enrollment extends Model {
  static associate(models) {
    // Define association to User model
    this.belongsTo(models.User, { 
      foreignKey: 'userId',
      as: 'student'
    });
    
    // Define association to Course model
    this.belongsTo(models.Course, { 
      foreignKey: 'courseId'
    });
    
    // Enrollment has many StudentProgress records
    if (models.StudentProgress) {
      this.hasMany(models.StudentProgress, {
        foreignKey: 'enrollmentId',
        as: 'progressRecords'
      });
    }
  }
}

Enrollment.init({
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
  status: {
    type: DataTypes.ENUM('enrolled', 'completed', 'dropped'),
    defaultValue: 'enrolled'
  },
  enrollmentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastActivityDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completionDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Enrollment',
  tableName: 'Enrollments',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'courseId']
    }
  ]
});

module.exports = Enrollment; 