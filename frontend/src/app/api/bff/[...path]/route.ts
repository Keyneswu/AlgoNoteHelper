import { NextRequest, NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const targetPath = `/api/${path.join("/")}`;
  const url = new URL(request.url);
  const qs = url.search;

  try {
    const method = request.method;
    const hasBody = method !== "GET" && method !== "HEAD";
    const body = hasBody ? await request.text() : undefined;
    const data = await apiFetch<unknown>(`${targetPath}${qs}`, {
      method,
      body,
      headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    });
    if (data === undefined) {
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
