import { NextResponse } from "next/server";

export function middleware(request: Request) {
  // No-op middleware, skickar bara vidare requesten
  return NextResponse.next();
}

export const config = {
  matcher: ["/(?!_next|static|favicon.ico|robots.txt|api/health).*"],
};
