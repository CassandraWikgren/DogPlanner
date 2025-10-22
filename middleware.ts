import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  try {
    const publicRoutes = ["/", "/login", "/register", "/rooms"];
    const pathname = req.nextUrl.pathname;

    // ✅ Tillåt offentliga sidor
    if (publicRoutes.some((r) => pathname.startsWith(r))) {
      return NextResponse.next();
    }

    // ✅ Läs cookies säkert (utan att logga hela objekt)
    const demoUser = req.cookies.get("demoUser")?.value;
    const demoOrg = req.cookies.get("demoOrg")?.value;

    // ✅ Tillåt om demo-cookies finns
    if (demoUser && demoOrg) {
      return NextResponse.next();
    }

    // ✅ Redirect på ett Edge-säkert sätt
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  } catch (err) {
    // ✅ Om något går fel: släpp igenom så sidan inte kraschar
    console.error("Middleware error:", (err as Error).message);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
