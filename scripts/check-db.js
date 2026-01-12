// Check current database state
require("dotenv").config();
const mysql = require("mysql2/promise");

async function checkDatabase() {
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
    // Check current indexes on tickets table
    console.log("\n=== Current Indexes on tickets table ===");
    const [indexes] = await connection.execute(
      "SHOW INDEX FROM tickets WHERE Key_name LIKE '%queue%' OR Key_name LIKE '%uq%'"
    );
    console.table(
      indexes.map((i) => ({
        Key_name: i.Key_name,
        Column_name: i.Column_name,
        Non_unique: i.Non_unique,
      }))
    );

    // Check recent tickets for BPJS counter
    console.log(
      "\n=== Recent tickets for BPJS counter (counter_id=?, date_for=2026-01-12) ==="
    );
    const [tickets] = await connection.execute(`
      SELECT id, counter_id, sequence, queue_number, date_for, status, created_at 
      FROM tickets 
      WHERE date_for = '2026-01-12'
      ORDER BY counter_id, sequence
    `);
    console.table(tickets);

    // Check what the next sequence would be
    console.log("\n=== Next sequence for counter_id with date 2026-01-12 ===");
    const [seq] = await connection.execute(`
      SELECT counter_id, MAX(sequence) as max_seq, COUNT(*) as ticket_count 
      FROM tickets 
      WHERE date_for = '2026-01-12'
      GROUP BY counter_id
    `);
    console.table(seq);
  } finally {
    await connection.end();
  }
}

checkDatabase().catch(console.error);
