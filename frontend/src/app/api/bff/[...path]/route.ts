import { NextRequest, NextResponse } from "next/server";
import { apiFetch, apiFetchStream, ApiError } from "@/lib/api";

type RouteContext = { params: Promise<{ path: string[] }> };

function isAskStreamPath(path: string[]): boolean {
  return path.length === 2 && path[0] === "ask" && path[1] === "stream";
}

async function proxyStream(request: NextRequest, targetPath: string) {
  const body = await request.text();
  const upstream = await apiFetchStream(targetPath, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });

  const headers = new Headers();
  headers.set("Content-Type", "text/event-stream; charset=utf-8");
  headers.set("Cache-Control", "no-cache, no-transform");
  headers.set("Connection", "keep-alive");
  headers.set("X-Accel-Buffering", "no");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const targetPath = `/api/${path.join("/")}`;
  const url = new URL(request.url);
  const qs = url.search;

  try {
    if (request.method === "POST" && isAskStreamPath(path)) {
      return await proxyStream(request, `${targetPath}${qs}`);
    }

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
