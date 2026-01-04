/* FILE: src/server/migrations/20241211000003-create-location-members.js */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('location_members', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      location_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'service_locations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('VISITOR', 'ADMIN', 'OWNER'),
        allowNull: false,
        defaultValue: 'ADMIN',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('location_members', ['location_id', 'user_id'], {
      unique: true,
      name: 'uq_member_loc_user',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('location_members');
  },
};