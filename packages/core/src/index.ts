/**
 * @furescue/core — modular monolith domain layer.
 *
 * Layer rules (enforced by convention and review):
 *   route/controller → service → repository → Prisma
 *
 * Nothing in this package talks HTTP. Web (Next.js) and mobile (Expo) are
 * thin clients over the same services.
 */
export * from "./config/env.ts";
export * from "./db/prisma.ts";
export * from "./shared/errors.ts";
export * from "./shared/types.ts";
export * from "./shared/pagination.ts";
export * from "./shared/api.ts";
export * from "./shared/audit.ts";
export * from "./shared/authz.ts";

export * from "./modules/auth/index.ts";
export * from "./modules/notifications/index.ts";
export * from "./modules/reports/index.ts";
export * from "./modules/animals/index.ts";
export * from "./modules/adoptions/index.ts";
export * from "./modules/health/index.ts";

export * from "./generated/prisma/enums.ts";
