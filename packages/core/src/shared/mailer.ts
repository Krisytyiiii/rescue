import nodemailer, { type Transporter } from "nodemailer";

import { env } from "../config/env.ts";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });
  }

  return transporter;
}

export function isMailerConfigured(): boolean {
  return Boolean(env.SMTP_HOST);
}

/**
 * Gmail only allows sending as the authenticated account or a verified
 * "Send mail as" alias. A From on a domain we don't own is accepted at SMTP
 * time and then silently dropped during the recipient's DMARC checks, so fall
 * back to the Gmail account while keeping the display name.
 */
function resolveFromAddress(): string {
  const configured = env.SMTP_FROM.trim();
  const match = configured.match(/^(.*?)<([^>]+)>$/);
  const displayName = match?.[1]?.trim() ?? "";
  const fromEmail = (match?.[2] ?? configured).trim().toLowerCase();
  const userEmail = env.SMTP_USER?.trim().toLowerCase();

  const isGmail = env.SMTP_HOST?.toLowerCase() === "smtp.gmail.com";
  if (isGmail && userEmail && !fromEmail.endsWith("@gmail.com")) {
    console.warn(
      `[mail] SMTP_FROM "${fromEmail}" can't be sent through Gmail. Using "${userEmail}".`,
    );
    return displayName ? `${displayName} <${userEmail}>` : userEmail;
  }

  return configured;
}

/**
 * Single outbound mail path. Returns false (instead of throwing) when SMTP is
 * not configured so local development can continue with the console fallback.
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    console.warn(
      `[mail] SMTP is not configured. Skipped "${message.subject}" to ${message.to}.`,
    );
    return false;
  }

  await transport.sendMail({ from: resolveFromAddress(), ...message });
  return true;
}
