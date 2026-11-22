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

  await transport.sendMail({ from: env.SMTP_FROM, ...message });
  return true;
}
