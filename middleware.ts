import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    const publicRoutes = ["/", "/login", "/register", "/rooms"];

    const pathname = req.nextUrl.pathname;

    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Hämta cookies säkert
    const demoUser = req.cookies.get("demoUser")?.value || null;
    const demoOrg = req.cookies.get("demoOrg")?.value || null;

    if (demoUser && demoOrg) {
      return NextResponse.next();
    }

    // Try-catch på redirect för att logga eventuella fel
    const redirectUrl = new URL("/login", req.url);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[middleware crash]", err);
    // Returnera en minimal textresponse så vi ser felet
    return new Response("Middleware error: " + (err as Error).message, {
      status: 500,
    });
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
