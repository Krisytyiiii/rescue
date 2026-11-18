import fs from "node:fs";

const env = fs.readFileSync(".env", "utf8");
const urlRef = /NEXT_PUBLIC_SUPABASE_URL="https:\/\/([^.]+)/.exec(env)?.[1];
const anon = /NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"/.exec(env)?.[1];
const service = /SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/.exec(env)?.[1];

const decode = (token) => JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());

if (anon) {
  const p = decode(anon);
  console.log("env project URL ref :", urlRef);
  console.log("anon key ref        :", p.ref, "role:", p.role);
}
if (service) {
  const p = decode(service);
  console.log("service key ref     :", p.ref, "role:", p.role);
}
