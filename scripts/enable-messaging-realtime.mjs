import "dotenv/config";
import pg from "pg";

/**
 * Adds the messaging tables to Supabase's Realtime publication so the admin
 * console can subscribe to `postgres_changes`. Idempotent.
 *
 * Run with: node scripts/enable-messaging-realtime.mjs
 */

const TABLES = ["conversations", "conversation_participants", "messages", "notifications"];

const raw = process.env.DATABASE_URL;
if (!raw) throw new Error("DATABASE_URL is not set");

const url = new URL(raw);
url.searchParams.set("sslmode", "no-verify");

const client = new pg.Client({
  connectionString: url.toString(),
  connectionTimeoutMillis: 20_000,
});

await client.connect();

const publication = await client.query(
  "SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'",
);
if (publication.rowCount === 0) {
  throw new Error(
    "The supabase_realtime publication does not exist. Enable Realtime in the Supabase dashboard first.",
  );
}

for (const table of TABLES) {
  const existing = await client.query(
    `SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = $1`,
    [table],
  );
  if (existing.rowCount > 0) {
    console.log(`already enabled  ${table}`);
    continue;
  }
  await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public."${table}"`);
  console.log(`enabled          ${table}`);
}

await client.end();
