import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Rutas protegidas del panel admin
  const protectedPaths = [
    "/admin",
    "/admin/",
    "/admin/tickets",
    "/admin/register-buyer",
    "/admin/marcar-qr-manual",
    "/admin/backup",
  ];

  const isProtected = protectedPaths.some((p) =>
    req.nextUrl.pathname.startsWith(p)
  );

  // Permitir el login y logout sin restricciones
  if (req.nextUrl.pathname.startsWith("/admin-login")) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/admin-logout")) return NextResponse.next();

  if (isProtected) {
    const cookie = req.cookies.get("admin_auth");
    if (!cookie || cookie.value !== "1") {
      url.pathname = "/admin-login"; // redirigir al login
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Definir qué rutas mira el middleware
export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    "/admin-login",
    "/admin-logout",
  ],
};