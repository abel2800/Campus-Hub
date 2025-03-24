'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'notificationSettings', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: JSON.stringify({
        emailNotifications: 'all',
        newMessageNotification: true,
        friendRequestNotification: true,
        postLikeNotification: true,
        courseNotification: true
      })
    });
    
    await queryInterface.addColumn('Users', 'privacySettings', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: JSON.stringify({
        profileVisibility: 'friends',
        searchable: true,
        showCourses: true
      })
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'bio');
    await queryInterface.removeColumn('Users', 'notificationSettings');
    await queryInterface.removeColumn('Users', 'privacySettings');
  }
}; 