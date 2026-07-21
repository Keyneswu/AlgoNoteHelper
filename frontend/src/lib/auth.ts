import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/algonote",
});

function collectTrustedOrigins(): string[] {
  // Docs: https://better-auth.com/docs/reference/security#trusted-origins
  // Browser Origin must match exactly (scheme + host + port). localhost ≠ 127.0.0.1 ≠ public IP.
  const fromEnv = [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    ...(process.env.CORS_ORIGINS ?? "").split(","),
    ...(process.env.TRUSTED_ORIGINS ?? "").split(","),
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/\/$/, ""));

  const defaults = ["http://localhost:3000", "http://127.0.0.1:3000"];
  return [...new Set([...fromEnv, ...defaults])];
}

export const auth = betterAuth({
  database: pool,
  trustedOrigins: collectTrustedOrigins(),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  // Behind Cloudflare / nginx the container sees the proxy IP unless we read
  // forwarded headers. Without this, rate limits collapse into one shared bucket
  // and auth/get-session/BFF calls flake as Unauthorized or bounce login↔notes.
  // Docs: https://better-auth.com/docs/reference/options#advanced
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"],
    },
  },
  plugins: [
    admin(),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
