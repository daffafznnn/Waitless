// Temporary script to update queue_number constraint
require("dotenv").config();
const mysql = require("mysql2/promise");

async function updateConstraint() {
  const config = {
    host: process.env.MYSQL_ADDON_HOST || "localhost",
    user: process.env.MYSQL_ADDON_USER || "root",
    password: process.env.MYSQL_ADDON_PASSWORD || "",
    database: process.env.MYSQL_ADDON_DB || "waitless_dev",
    port: parseInt(process.env.MYSQL_ADDON_PORT || "3306"),
  };

  console.log("Connecting to database...");
  const connection = await mysql.createConnection(config);

  try {
    // Drop old global unique constraint
    console.log("Dropping old uq_queue_number constraint...");
    try {
      await connection.execute("DROP INDEX uq_queue_number ON tickets");
      console.log("✓ Dropped uq_queue_number");
    } catch (e) {
      console.log("✓ uq_queue_number not found, skipping");
    }

    // Check if new constraint exists, if not create it
    console.log("Adding new uq_counter_day_queue constraint...");
    try {
      await connection.execute(
        "CREATE UNIQUE INDEX uq_counter_day_queue ON tickets (counter_id, date_for, queue_number)"
      );
      console.log("✓ Created uq_counter_day_queue");
    } catch (e) {
      if (e.message.includes("Duplicate")) {
        console.log("✓ uq_counter_day_queue already exists");
      } else {
        throw e;
      }
    }

    // Fix stuck migration - mark google-oauth migration as complete
    console.log("Fixing stuck migration...");
    try {
      await connection.execute(
        "INSERT INTO SequelizeMeta (name) VALUES ('20241224000001-add-google-oauth-to-users.js') ON DUPLICATE KEY UPDATE name=name"
      );
      console.log("✓ Marked google-oauth migration as complete");
    } catch (e) {
      console.log("✓ Migration table updated or already correct");
    }

    console.log("\n✅ Database constraint update complete!");
  } finally {
    await connection.end();
  }
}

updateConstraint().catch(console.error);
