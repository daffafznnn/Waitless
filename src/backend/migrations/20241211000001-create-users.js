/* FILE: src/server/migrations/20241211000001-create-users.js */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(191),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('VISITOR', 'ADMIN', 'OWNER'),
        allowNull: false,
        defaultValue: 'VISITOR',
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'users_email_unique',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  },
};