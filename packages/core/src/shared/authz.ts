import type { RoleName } from "../generated/prisma/enums.ts";
import { ForbiddenError, UnauthorizedError } from "./errors.ts";
import type { Actor } from "./types.ts";

export function requireActor(actor?: Actor): Actor {
  if (!actor) throw new UnauthorizedError();
  return actor;
}

export function requireRole(actor: Actor | undefined, ...roles: RoleName[]): Actor {
  const current = requireActor(actor);
  if (!roles.includes(current.role)) {
    throw new ForbiddenError(`Requires one of: ${roles.join(", ")}`);
  }
  return current;
}

export function isAdmin(actor?: Actor): boolean {
  return actor?.role === "admin";
}

export function isStaff(actor?: Actor): boolean {
  return actor?.role === "admin" || actor?.role === "rescuer";
}
