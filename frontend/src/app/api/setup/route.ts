import { NextResponse } from "next/server";
import { Pool } from "pg";
import { auth } from "@/lib/auth";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/algonote",
});

async function ensureAuthTables() {
  // Better Auth migrate is preferred; this is a safety no-op if tables exist.
  try {
    await pool.query('SELECT 1 FROM "user" LIMIT 1');
  } catch {
    // Tables missing — caller should run `pnpm dlx auth migrate`
    throw new Error('Better Auth tables missing. Run: pnpm dlx auth@latest migrate');
  }
}

export async function GET() {
  try {
    await ensureAuthTables();
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM "user"',
    );
    const count = Number(result.rows[0]?.count ?? 0);
    return NextResponse.json({ needsSetup: count === 0, userCount: count });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Setup status failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureAuthTables();
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM "user"',
    );
    const count = Number(result.rows[0]?.count ?? 0);
    if (count > 0) {
      return NextResponse.json(
        { error: "Setup already completed" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    if (!body.email || !body.password || !body.name) {
      return NextResponse.json(
        { error: "name, email, and password are required" },
        { status: 400 },
      );
    }

    // First-run bootstrap: public signup stays disabled; use internal adapter.
    const ctx = await auth.$context;
    const user = await ctx.internalAdapter.createUser({
      email: body.email,
      name: body.name,
      emailVerified: true,
      role: "admin",
    });
    if (!user) {
      return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
    }
    const hashed = await ctx.password.hash(body.password);
    await ctx.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: hashed,
    });

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Setup failed" },
      { status: 500 },
    );
  }
}
