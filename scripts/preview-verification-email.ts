import { writeFileSync } from "node:fs";

import { buildVerificationEmail } from "../packages/core/src/modules/auth/verification-email.ts";

const email = buildVerificationEmail({
  firstName: "Maria",
  email: "maria@example.com",
  code: "482913",
  expiresMinutes: 10,
});

const out = "docs/email-verification-preview.html";
writeFileSync(out, email.html, "utf8");
console.log(`Wrote ${out}\nSubject: ${email.subject}`);
