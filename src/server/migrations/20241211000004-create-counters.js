/* FILE: src/server/migrations/20241211000004-create-counters.js */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('counters', {
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
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      prefix: {
        type: Sequelize.STRING(4),
        allowNull: false,
        defaultValue: 'A',
      },
      open_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      close_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      capacity_per_day: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('counters', ['location_id'], {
      name: 'counters_location_id_index',
    });

    await queryInterface.addIndex('counters', ['is_active'], {
      name: 'counters_is_active_index',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('counters');
  },
};