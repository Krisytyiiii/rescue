import fs from "node:fs";
import crypto from "node:crypto";
import "dotenv/config";
import pg from "pg";

/**
 * Applies one migration file over the transaction pooler (port 6543) and
 * records it in `_prisma_migrations`.
 *
 * Usage: node scripts/apply-migration.mjs 20261118000001_pending_account_status
 */
const migrationName = process.argv[2];
if (!migrationName) throw new Error("Pass the migration folder name");

const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) throw new Error("DATABASE_URL is not set");

// Supabase's pooler presents a certificate chain that Node's default trust
// store rejects. `sslmode=no-verify` keeps the connection encrypted while
// accepting the provider certificate.
const parsed = new URL(rawConnectionString);
parsed.searchParams.set("sslmode", "no-verify");
const connectionString = parsed.toString();

const migrationPath = `prisma/migrations/${migrationName}/migration.sql`;
const migrationSql = fs.readFileSync(migrationPath, "utf8");
const checksum = crypto.createHash("sha256").update(migrationSql).digest("hex");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20_000,
});

await client.connect();
console.log("Connected. Applying", migrationName);

try {
  await client.query("BEGIN");
  await client.query(migrationSql);

  const existing = await client.query(
    `SELECT 1 FROM "_prisma_migrations"
     WHERE "migration_name" = $1 AND "finished_at" IS NOT NULL`,
    [migrationName],
  );

  if (existing.rowCount === 0) {
    await client.query(
      `INSERT INTO "_prisma_migrations"
         ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
       VALUES ($1, $2, now(), $3, 1)`,
      [crypto.randomUUID(), checksum, migrationName],
    );
  }

  await client.query("COMMIT");
  console.log("APPLIED:", migrationName);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
