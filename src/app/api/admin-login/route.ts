// src/app/api/admin-login/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password === process.env.ADMIN_PASSWORD) {
    const response = NextResponse.json({ ok: true });
    response.headers.append(
      "Set-Cookie",
      [
        "admin_auth=1",
        "Path=/",
        "Max-Age=28800",          //8h
        "HttpOnly",
        "SameSite=Strict",
        "Secure",                 //en producción con HTTPS
      ].join("; ")
    );
    return response;
  }

  return NextResponse.json(
    { ok: false, error: "Clave incorrecta" },
    { status: 401 }
  );
}

export async function GET(req: NextRequest) {
  // puedes usar la API de cookies directamente
  const cookie = req.cookies.get("admin_auth");

  if (cookie?.value === "1") {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}