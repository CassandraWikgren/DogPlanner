import { NextResponse } from "next/server";

export async function GET() {
  // Automatisk demo-login för enkel åtkomst
  const res = NextResponse.redirect(
    new URL(
      "/dashboard",
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    )
  );
  res.cookies.set("demoUser", "test@dogplanner.se", {
    httpOnly: false, // Måste vara false så att JavaScript kan läsa dem
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.set("demoOrg", "test-org", {
    httpOnly: false, // Måste vara false så att JavaScript kan läsa dem
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function POST(req: Request) {
  const { email, org } = await req.json();
  if (!email || !org) {
    return new NextResponse("Saknar e-post eller organisation", {
      status: 400,
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("demoUser", email, {
    httpOnly: false, // Måste vara false så att JavaScript kan läsa dem
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.set("demoOrg", org, {
    httpOnly: false, // Måste vara false så att JavaScript kan läsa dem
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
