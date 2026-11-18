import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

// The monorepo keeps one .env at the repository root. npm runs Next with
// cwd=apps/web, so load the root file before Next inlines NEXT_PUBLIC_*.
loadEnv({ path: resolve(process.cwd(), "../../.env") });
loadEnv();

const nextConfig: NextConfig = {
  transpilePackages: ["@furescue/core"],
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
