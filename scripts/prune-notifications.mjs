import "dotenv/config";
import pg from "pg";

/**
 * Retention sweep for the notifications table.
 *
 * Read notifications older than --days (default 90) are deleted; unread ones
 * are kept twice as long so nobody loses a pending alert just because it is
 * old. Pass --dry-run to only report the counts.
 *
 * Usage: node scripts/prune-notifications.mjs [--days=90] [--dry-run]
 */
const args = process.argv.slice(2);
const daysArg = args.find((arg) => arg.startsWith("--days="));
const retentionDays = daysArg ? Number(daysArg.split("=")[1]) : 90;
const dryRun = args.includes("--dry-run");

if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
  throw new Error("--days must be a positive number");
}

const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) throw new Error("DATABASE_URL is not set");

const parsed = new URL(rawConnectionString);
parsed.searchParams.set("sslmode", "no-verify");

const client = new pg.Client({
  connectionString: parsed.toString(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20_000,
});

await client.connect();

try {
  const readCutoff = new Date(
    Date.now() - retentionDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const unreadCutoff = new Date(
    Date.now() - retentionDays * 2 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const preview = await client.query(
    `select
       count(*) filter (where is_read and sent_at < $1) as read_rows,
       count(*) filter (where not is_read and sent_at < $2) as unread_rows
     from notifications`,
    [readCutoff, unreadCutoff],
  );

  const { read_rows, unread_rows } = preview.rows[0];
  console.log(
    `Retention ${retentionDays}d → ${read_rows} read and ${unread_rows} unread notifications would be removed.`,
  );

  if (dryRun) {
    console.log("Dry run: nothing deleted.");
  } else {
    const result = await client.query(
      `delete from notifications
        where (is_read and sent_at < $1)
           or (not is_read and sent_at < $2)`,
      [readCutoff, unreadCutoff],
    );
    console.log(`Deleted ${result.rowCount} notifications.`);
  }
} finally {
  await client.end();
}
