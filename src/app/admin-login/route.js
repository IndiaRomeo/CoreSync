import { NextResponse } from "next/server";

export async function POST(req) {
  const { password } = await req.json();
  const valid = password === process.env.ADMIN_PASSWORD;
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Clave incorrecta" }, { status: 401 });
  }
  // Set cookie (simple, no httpOnly en este ejemplo)
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_auth", "1", { path: "/", maxAge: 60 * 60 * 8 }); // 8 horas
  return res;
}

export async function GET() {
  // Permite saber si está logueado
  return NextResponse.json({ ok: true });
}