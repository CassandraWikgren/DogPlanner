import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Tillåt vissa sidor utan auth
  const publicRoutes = ["/", "/login", "/register", "/rooms"];

  if (publicRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Kontrollera om det finns demo-cookies
  const demoUser = req.cookies.get("demoUser");
  const demoOrg = req.cookies.get("demoOrg");

  // Om demo-cookies finns, tillåt åtkomst
  if (demoUser && demoOrg) {
    return NextResponse.next();
  }

  // För alla andra routes utan demo-cookies, redirecta till login
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: [
    /*
     * Matcha alla request paths utom för de som börjar med:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Statiska filer (bilder etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
