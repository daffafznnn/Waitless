"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Drop the old global unique constraint on queue_number
    try {
      await queryInterface.removeIndex("tickets", "uq_queue_number");
      console.log("Dropped old uq_queue_number constraint");
    } catch (error) {
      console.log("uq_queue_number constraint may not exist, skipping drop");
    }

    // Step 2: Add new unique constraint on counter_id + date_for + queue_number
    await queryInterface.addIndex(
      "tickets",
      ["counter_id", "date_for", "queue_number"],
      {
        name: "uq_counter_day_queue",
        unique: true,
      }
    );
    console.log("Added new uq_counter_day_queue constraint");
  },

  async down(queryInterface, Sequelize) {
    // Rollback: Remove new constraint and add back old one
    try {
      await queryInterface.removeIndex("tickets", "uq_counter_day_queue");
    } catch (error) {
      console.log(
        "uq_counter_day_queue constraint may not exist, skipping drop"
      );
    }

    // Add back the old global unique constraint
    await queryInterface.addIndex("tickets", ["queue_number"], {
      name: "uq_queue_number",
      unique: true,
    });
  },
};
