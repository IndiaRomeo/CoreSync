import { NextResponse } from "next/server";

export async function POST() {
  // Elimina la cookie
  const response = NextResponse.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    "admin_auth=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict"
  );
  return response;
}