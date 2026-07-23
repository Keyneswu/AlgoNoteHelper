import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/algonote",
});

/** True when Better Auth has zero users (first-run setup required). */
export async function getNeedsSetup(): Promise<boolean> {
  try {
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM "user"',
    );
    return Number(result.rows[0]?.count ?? 0) === 0;
  } catch {
    // Tables missing / DB unreachable — do not force /setup; show landing.
    return false;
  }
}
