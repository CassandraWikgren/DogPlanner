import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    const publicRoutes = ["/", "/login", "/register", "/rooms"];
    const pathname = req.nextUrl.pathname;

    console.log("[middleware] Pathname:", pathname);

    // Tillåt offentliga sidor
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Läs cookies (edge-säkert)
    let cookiesList: string[] = [];
    try {
      const cookies = req.cookies.getAll();
      cookiesList = cookies.map((c) => c.name);
      console.log("[middleware] Cookies:", cookiesList);
    } catch (cookieError) {
      console.warn("[middleware] Kunde inte läsa cookies:", cookieError);
    }

    // Hämta demo-cookies
    const demoUser = req.cookies.get("demoUser")?.value ?? null;
    const demoOrg = req.cookies.get("demoOrg")?.value ?? null;

    if (demoUser && demoOrg) {
      console.log("[middleware] Demo-cookies finns, tillåts.");
      return NextResponse.next();
    }

    // ✅ Edge-safe redirect (använd req.nextUrl i stället för req.url)
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    console.log("[middleware] Redirectar till /login");
    return NextResponse.redirect(loginUrl);
  } catch (err) {
    console.error("[middleware] FEL:", err);
    // Släpp igenom för att undvika 500
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
