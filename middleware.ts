import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Tillåt vissa sidor utan auth
  const publicRoutes = ["/", "/login", "/register", "/rooms"];

  // Logga pathname och cookies för felsökning
  console.log("[middleware] Pathname:", req.nextUrl.pathname);
  console.log("[middleware] Cookies:", req.cookies);

  if (publicRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
    console.log("[middleware] Public route, tillåts.");
    return NextResponse.next();
  }

  // Kontrollera om det finns demo-cookies
  const cookies = req.cookies.getAll();
  console.log(
    "[middleware] Cookies:",
    cookies.map((c) => c.name)
  );
  console.log("[middleware] Antal cookies:", cookies.length);

  // Hämta demo-cookies (om de finns)
  const demoUser = req.cookies.get("demoUser")?.value;
  const demoOrg = req.cookies.get("demoOrg")?.value;

  console.log("[middleware] demoUser:", demoUser);
  console.log("[middleware] demoOrg:", demoOrg);

  // Om demo-cookies finns, tillåt åtkomst
  if (demoUser && demoOrg) {
    console.log("[middleware] Demo-cookies finns, tillåts.");
    return NextResponse.next();
  }

  // För alla andra routes utan demo-cookies, redirecta till login
  console.log("[middleware] Redirectar till /login");
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
