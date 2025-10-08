import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, org } = await req.json();
  if (!email || !org) {
    return new NextResponse("Saknar e-post eller organisation", {
      status: 400,
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("demoUser", email, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.set("demoOrg", org, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
