// src/app/api/admin-login/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  const { password } = await req.json();
  if (password === process.env.ADMIN_PASSWORD) {
    // Set cookie (HttpOnly, 8h)
    const response = NextResponse.json({ ok: true });
    response.headers.append(
      "Set-Cookie",
      `admin_auth=1; Path=/; Max-Age=28800; HttpOnly; SameSite=Strict`
    );
    return response;
  } else {
    return NextResponse.json({ ok: false, error: "Clave incorrecta" }, { status: 401 });
  }
}

// Chequea cookie admin_auth
export async function GET(req) {
  const cookies = req.headers.get("cookie") || "";
  if (cookies.includes("admin_auth=1")) {
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}