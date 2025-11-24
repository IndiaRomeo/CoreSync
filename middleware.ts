// middleware.ts (en la raíz del proyecto)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Solo nos interesa todo lo que esté DENTRO de /admin, no la raíz /admin
  // Ej: /admin/tickets, /admin/dashboard, /admin/lo-que-sea
  const isProtected = pathname.startsWith("/admin/"); // 👈 ojo la barra al final

  if (!isProtected) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("admin_auth");

  // Si NO hay cookie válida -> manda siempre a /admin (donde está el login)
  if (!cookie || cookie.value !== "1") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    url.search = ""; // por si acaso, sin query params
    return NextResponse.redirect(url);
  }

  // Hay cookie válida -> dejar pasar
  return NextResponse.next();
}

// Solo vigila rutas /admin/... (no /admin solo)
export const config = {
  matcher: ["/admin/:path*"],
};