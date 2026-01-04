/* FILE: src/server/migrations/20241211000006-create-ticket-events.js */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ticket_events', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      ticket_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'tickets',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      actor_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      event_type: {
        type: Sequelize.ENUM('ISSUED', 'CALLED', 'RESUMED', 'HELD', 'DONE', 'CANCELLED', 'EXPIRED'),
        allowNull: false,
      },
      note: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('ticket_events', ['ticket_id', 'created_at'], {
      name: 'ticket_events_ticket_created_index',
    });

    await queryInterface.addIndex('ticket_events', ['actor_id'], {
      name: 'ticket_events_actor_id_index',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ticket_events');
  },
};