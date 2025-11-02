import { NextResponse } from "next/server";

// Ensure this route is always executed at request-time and never pre-rendered
export const dynamic = "force-dynamic";
export const revalidate = 0;

function maskUrl(url?: string) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      host: u.host, // e.g. fhdkkkujnhteetllxypg.supabase.co
      projectRef: u.host.split(".")[0], // e.g. fhdkkkujnhteetllxypg
      origin: `${u.protocol}//${u.host}`,
      // don't return path or query; never return keys
    };
  } catch {
    return { host: "invalid-url" };
  }
}

export async function GET() {
  // Safety gate: In production (e.g., on Vercel), disable this endpoint by default
  // Enable explicitly by setting NEXT_PUBLIC_ENABLE_ENV_ROUTE="true" in the environment
  if (
    process.env.VERCEL &&
    process.env.NEXT_PUBLIC_ENABLE_ENV_ROUTE !== "true"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabaseInfo = maskUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

  // Only expose safe, non-secret metadata
  const data = {
    supabase: supabaseInfo,
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL || false,
    vercelUrl: process.env.VERCEL_URL || null,
    vercelProjectName: process.env.VERCEL_PROJECT_NAME || null,
  };

  return NextResponse.json(data, { status: 200 });
}
