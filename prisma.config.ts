import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration.
 * `process.env` is used directly (rather than `env()`) so `prisma generate`
 * still works on installs without a .env file (CI, fresh clones).
 *
 * Supabase's pooler presents a self-signed chain. Newer pg/Prisma clients
 * treat `sslmode=require` as verify-full, which fails. Use `no-verify` for CLI
 * connections (the app client sets this on the adapter instead).
 */
function migrationUrl(value: string | undefined): string | undefined {
  if (!value) return value;
  try {
    const url = new URL(value);
    url.searchParams.set("sslmode", "no-verify");
    url.searchParams.delete("uselibpqcompat");
    return url.toString();
  } catch {
    return value;
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl(process.env.DATABASE_URL) ?? "",
    directUrl: migrationUrl(process.env.DIRECT_URL ?? process.env.DATABASE_URL),
  },
});
