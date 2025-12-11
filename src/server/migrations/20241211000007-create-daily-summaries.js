/* FILE: src/server/migrations/20241211000007-create-daily-summaries.js */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('daily_summaries', {
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
      date_for: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      total_issued: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_done: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_hold: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_cancel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      avg_service_seconds: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    });

    await queryInterface.addIndex('daily_summaries', ['location_id', 'date_for'], {
      unique: true,
      name: 'uq_summary_loc_date',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('daily_summaries');
  },
};