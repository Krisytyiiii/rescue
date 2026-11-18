import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import { env } from "../config/env.ts";

/**
 * Single Prisma client per process. Reused across hot reloads in development
 * to avoid exhausting Supabase connection slots.
 */
const globalForPrisma = globalThis as unknown as {
  __furescuePrisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  // Supabase/Supavisor presents a self-signed chain. `sslmode=require` in the
  // URL is interpreted as verify-full by newer pg versions, so strip the SSL
  // query params and set the TLS behaviour explicitly on the pool.
  const url = new URL(env.DATABASE_URL);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("uselibpqcompat");

  const adapter = new PrismaPg({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    max: env.NODE_ENV === "production" ? 10 : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient = globalForPrisma.__furescuePrisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.__furescuePrisma = prisma;
}

export type Db = PrismaClient;
export { PrismaClient } from "../generated/prisma/client.ts";
export type { Prisma } from "../generated/prisma/client.ts";
