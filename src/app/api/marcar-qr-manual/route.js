import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const body = await req.json();
    const { codigo, validador } = body;

    if (!codigo) {
      return NextResponse.json(
        { ok: false, error: "Falta código" },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from("entradas")
      .update({
        qr_used_at: nowIso,
        qr_used_by: validador || "ADMIN_PANEL",
      })
      .eq("codigo", codigo);

    if (error) {
      console.error("❌ Error marcando QR manual:", error);
      return NextResponse.json(
        { ok: false, error: "Error actualizando entrada" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      qr_used_at: nowIso,
      qr_used_by: validador || "ADMIN_PANEL",
    });
  } catch (e) {
    console.error("❌ Error general en /api/marcar-qr-manual:", e);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 }
    );
  }
}