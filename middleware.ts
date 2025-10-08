// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Den här middleware gör ingenting än, men hindrar fel vid uppstart
export function middleware(request: NextRequest) {
  return NextResponse.next();
}
