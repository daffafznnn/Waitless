/* FILE: src/server/migrations/20241211000002-create-service-locations.js */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('service_locations', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      owner_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      name: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      lat: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      },
      lng: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
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

    await queryInterface.addIndex('service_locations', ['owner_id'], {
      name: 'service_locations_owner_id_index',
    });

    await queryInterface.addIndex('service_locations', ['city'], {
      name: 'service_locations_city_index',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('service_locations');
  },
};