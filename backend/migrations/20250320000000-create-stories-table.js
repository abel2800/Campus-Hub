'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if Stories table already exists
      const tables = await queryInterface.showAllTables();
      if (tables.includes('Stories')) {
        console.log('Stories table already exists, skipping creation');
        return;
      }
      
      await queryInterface.createTable('Stories', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        mediaUrl: {
          type: Sequelize.STRING,
          allowNull: false
        },
        mediaType: {
          type: Sequelize.ENUM('image', 'video'),
          allowNull: false,
          defaultValue: 'image'
        },
        caption: {
          type: Sequelize.STRING,
          allowNull: true
        },
        expiresAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        likes: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

      // Create indexes for better query performance, checking first to avoid errors
      const indicesToCreate = await queryInterface.sequelize.query(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'Stories' AND indexname IN ('story_user_idx', 'story_expiration_idx')",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      const indexNames = indicesToCreate.map(idx => idx.indexname);
      
      if (!indexNames.includes('story_user_idx')) {
        await queryInterface.addIndex('Stories', ['userId'], {
          name: 'story_user_idx'
        });
      }
      
      if (!indexNames.includes('story_expiration_idx')) {
        await queryInterface.addIndex('Stories', ['expiresAt'], {
          name: 'story_expiration_idx'
        });
      }
    } catch (error) {
      console.error('Error in migration:', error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.dropTable('Stories');
    } catch (error) {
      console.error('Error dropping Stories table:', error);
    }
  }
}; 