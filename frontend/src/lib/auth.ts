import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/algonote",
});

export const auth = betterAuth({
  database: pool,
  // localhost vs 127.0.0.1 are different origins; trust both in local dev.
  // Docs: https://better-auth.com/docs/reference/security#trusted-origins
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [
    admin(),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
