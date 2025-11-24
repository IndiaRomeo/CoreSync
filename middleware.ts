import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Solo interceptar rutas del panel admin (páginas, no APIs)
  const isProtected = pathname.startsWith("/admin");

  if (!isProtected) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("admin_auth");

  // Si NO hay cookie válida -> manda siempre a /admin (que ya muestra el login)
  if (!cookie || cookie.value !== "1") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // Hay cookie válida -> dejar pasar
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};