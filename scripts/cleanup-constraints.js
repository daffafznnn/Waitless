// Clean up all duplicate unique constraints on queue_number
require("dotenv").config();
const mysql = require("mysql2/promise");

async function cleanupConstraints() {
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
    // Get all queue_number related indexes
    const [indexes] = await connection.execute(
      "SHOW INDEX FROM tickets WHERE Key_name LIKE 'queue_number%'"
    );
    const indexNames = [...new Set(indexes.map((i) => i.Key_name))];

    console.log("Found indexes to drop:", indexNames);

    // Drop all queue_number* indexes
    for (const indexName of indexNames) {
      try {
        console.log(`Dropping ${indexName}...`);
        await connection.execute(`DROP INDEX \`${indexName}\` ON tickets`);
        console.log(`✓ Dropped ${indexName}`);
      } catch (e) {
        console.log(`✗ Could not drop ${indexName}: ${e.message}`);
      }
    }

    // Verify remaining indexes
    console.log("\n=== Remaining indexes ===");
    const [remaining] = await connection.execute(
      "SHOW INDEX FROM tickets WHERE Key_name LIKE '%queue%' OR Key_name LIKE '%uq%'"
    );
    console.table(
      remaining.map((i) => ({
        Key_name: i.Key_name,
        Column_name: i.Column_name,
        Non_unique: i.Non_unique,
      }))
    );

    console.log("\n✅ Cleanup complete!");
  } finally {
    await connection.end();
  }
}

cleanupConstraints().catch(console.error);
