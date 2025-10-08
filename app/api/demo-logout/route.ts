import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = NextResponse.redirect(new URL("/login", base));
  res.cookies.set("demoUser", "", { path: "/", maxAge: 0 });
  res.cookies.set("demoOrg", "", { path: "/", maxAge: 0 });
  return res;
}
