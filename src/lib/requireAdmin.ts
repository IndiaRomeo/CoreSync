import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  // aquí va el await
  const cookieStore = await cookies();
  const auth = cookieStore.get("admin_auth");

  if (!auth || auth.value !== "1") {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401 }
    );
  }

  // null = todo bien, puede seguir el handler
  return null;
}