import jwt, { type SignOptions } from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE = "furescue_session";
export const ONBOARDING_COOKIE = "furescue_oauth_onboarding";

const ISSUER = process.env.APP_NAME ?? "FurRescue";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const ONBOARDING_MAX_AGE = 60 * 15; // 15 minutes

export interface SessionPayload {
  sub: string;
  role: string;
  type: "access";
}

export interface OnboardingPayload {
  type: "oauth_onboarding";
  email: string;
  firstName: string;
  lastName: string;
}

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error("JWT_SECRET is missing or too short");
  }
  return value;
}

export function createSessionToken(user: { id: string; role: string }): string {
  const payload: SessionPayload = { sub: user.id, role: user.role, type: "access" };
  return jwt.sign(payload, secret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
    issuer: ISSUER,
  });
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, secret(), { issuer: ISSUER });
    if (typeof decoded === "string" || decoded.type !== "access") return null;
    return decoded as SessionPayload;
  } catch {
    return null;
  }
}

export function createOnboardingToken(data: {
  email: string;
  firstName: string;
  lastName: string;
}): string {
  const payload: OnboardingPayload = { type: "oauth_onboarding", ...data };
  return jwt.sign(payload, secret(), { expiresIn: ONBOARDING_MAX_AGE });
}

export function setOnboardingCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: ONBOARDING_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONBOARDING_MAX_AGE,
  });
}

export function clearOnboardingCookie(response: NextResponse): void {
  response.cookies.set({
    name: ONBOARDING_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readOnboarding(): Promise<OnboardingPayload | null> {
  const store = await cookies();
  const token = store.get(ONBOARDING_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, secret());
    if (typeof decoded === "string" || decoded.type !== "oauth_onboarding") return null;
    return decoded as OnboardingPayload;
  } catch {
    return null;
  }
}
