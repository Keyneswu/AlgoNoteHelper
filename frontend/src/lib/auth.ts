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
