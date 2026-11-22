/**
 * @deprecated Auth contracts live in `@/domain` and implementations in
 * `@/data`. Screens use a view model from `@/features/auth` instead.
 * This module only re-exports, so no second network layer can drift.
 */
export { API_BASE_URL, ApiError, webUrl } from "@/data";
export type {
  AuthUser,
  Barangay as BarangayOption,
  LoginInput,
  Session,
  SignupInput,
  SignupResult,
} from "@/domain/auth";
