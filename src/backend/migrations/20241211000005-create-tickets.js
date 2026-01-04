/* FILE: src/server/migrations/20241211000005-create-tickets.js */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tickets', {
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
        onDelete: 'RESTRICT',
      },
      counter_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'counters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      date_for: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      sequence: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      queue_number: {
        type: Sequelize.STRING(16),
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM('WAITING', 'CALLING', 'SERVING', 'HOLD', 'DONE', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'WAITING',
      },
      called_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      finished_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      hold_reason: {
        type: Sequelize.STRING(160),
        allowNull: true,
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

    await queryInterface.addIndex('tickets', ['counter_id', 'status', 'created_at'], {
      name: 'idx_next_ticket',
    });

    await queryInterface.addIndex('tickets', ['location_id', 'date_for'], {
      name: 'tickets_location_date_index',
    });

    await queryInterface.addIndex('tickets', ['counter_id', 'date_for', 'sequence'], {
      unique: true,
      name: 'uq_counter_day_seq',
    });

    await queryInterface.addIndex('tickets', ['queue_number'], {
      unique: true,
      name: 'uq_queue_number',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tickets');
  },
};