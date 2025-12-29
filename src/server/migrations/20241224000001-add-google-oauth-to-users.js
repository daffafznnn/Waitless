"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add google_id column
    await queryInterface.addColumn("users", "google_id", {
      type: Sequelize.STRING(191),
      allowNull: true,
      unique: true,
      after: "phone",
    });

    // Add avatar_url column
    await queryInterface.addColumn("users", "avatar_url", {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: "google_id",
    });

    // Add index on google_id
    await queryInterface.addIndex("users", ["google_id"], {
      name: "users_google_id_idx",
      unique: true,
      where: {
        google_id: { [Sequelize.Op.ne]: null },
      },
    });
  },

  async down(queryInterface) {
    // Remove index
    await queryInterface.removeIndex("users", "users_google_id_idx");

    // Remove columns
    await queryInterface.removeColumn("users", "avatar_url");
    await queryInterface.removeColumn("users", "google_id");
  },
};
