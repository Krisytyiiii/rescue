import fs from "node:fs";
import crypto from "node:crypto";
import "dotenv/config";
import pg from "pg";

/**
 * Applies the full schema + seed directly over the transaction pooler.
 * Needed when port 5432 is blocked and Supavisor cannot run Prisma's
 * migration advisory locks. Also records the migration in
 * _prisma_migrations so future `prisma migrate deploy` runs see it.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20_000,
});

const migrationName = "20261118000000_init";
const migrationSql = fs.readFileSync(
  `prisma/migrations/${migrationName}/migration.sql`,
  "utf8",
);
const checksum = crypto.createHash("sha256").update(migrationSql).digest("hex");
const applySql = fs.readFileSync("prisma/supabase-init.sql", "utf8");

await client.connect();
console.log("Connected. Applying schema and reference data...");

try {
  await client.query("BEGIN");

  await client.query(applySql);

  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
    );
  `);

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
