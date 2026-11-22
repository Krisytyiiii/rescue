import { env } from "../packages/core/src/config/env.ts";
import { sendMail } from "../packages/core/src/shared/mailer.ts";

async function main() {
  const to = "akeroshi@gmail.com";

  console.log(`Testing SMTP ${env.SMTP_HOST}:${env.SMTP_PORT} as ${env.SMTP_USER}`);
  console.log(`From: ${env.SMTP_FROM}`);

  try {
    const sent = await sendMail({
      to,
      subject: "FuRescue SMTP test",
      text: "If you received this, FuRescue OTP delivery is working.",
      html: "<p>If you received this, <strong>FuRescue OTP delivery is working.</strong></p>",
    });
    console.log(sent ? "SMTP test sent." : "SMTP not configured.");
  } catch (error) {
    console.error("SMTP test failed:", error);
    process.exitCode = 1;
  }
}

main();
