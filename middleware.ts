import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    // ✅ 1. Tillåt vissa offentliga sidor utan auth
    const publicRoutes = ["/", "/login", "/register", "/rooms"];
    const pathname = req.nextUrl.pathname;

    console.log("[middleware] Pathname:", pathname);

    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      console.log("[middleware] Public route, tillåts.");
      return NextResponse.next();
    }

    // ✅ 2. Läs cookies på ett säkert sätt
    let cookiesList = [];
    try {
      // getAll kan ibland krascha i Edge om man loggar direkt objektet
      const cookies = req.cookies.getAll();
      cookiesList = cookies.map((c) => c.name);
      console.log("[middleware] Cookies:", cookiesList);
      console.log("[middleware] Antal cookies:", cookies.length);
    } catch (cookieError) {
      console.warn("[middleware] Kunde inte läsa cookies säkert:", cookieError);
    }

    // ✅ 3. Hämta demo-cookies
    const demoUser = req.cookies.get("demoUser")?.value || null;
    const demoOrg = req.cookies.get("demoOrg")?.value || null;

    console.log("[middleware] demoUser:", demoUser);
    console.log("[middleware] demoOrg:", demoOrg);

    // ✅ 4. Om demo-cookies finns → tillåt åtkomst
    if (demoUser && demoOrg) {
      console.log("[middleware] Demo-cookies finns, tillåts.");
      return NextResponse.next();
    }

    // ✅ 5. Om inga cookies → redirecta till login
    console.log("[middleware] Redirectar till /login");
    return NextResponse.redirect(new URL("/login", req.url));
  } catch (err) {
    // ✅ 6. Fångar alla fel så Vercel inte visar 500
    console.error("[middleware] FEL:", err);
    // Tillåt ändå att sidan laddas (för att inte krascha produktion)
    return NextResponse.next();
  }
}

// ✅ 7. Matchning (samma som du hade)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
