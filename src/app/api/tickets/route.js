import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const cookieStore = cookies();
  const auth = cookieStore.get("admin_auth");
  if (!auth || auth.value !== "1") {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("entradas")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error leyendo entradas en /api/tickets:", error);
      return NextResponse.json({ ok: false, error: "Error leyendo entradas" }, { status: 500 });
    }

    const tickets = (data || []).map((row) => {

      // Normalizar Estado
      let estado = "Reservado";
      const sp = (row.status_pago || "").toLowerCase();
      if (sp === "aprobado") estado = "Pagado";
      else if (sp === "rechazado") estado = "Rechazado";

      return {
        Código: row.codigo || row.id || "",
        Nombre: row.buyer_name || "",
        Teléfono: row.buyer_phone || "",
        Email: row.buyer_email || "",
        Estado: estado,
        "Qr usado": row.qr_usado ? "SI" : "NO",
        Qr: row.qr_base64 || "",
      };
    });

    return NextResponse.json({ ok: true, tickets });

  } catch (e) {
    console.error("❌ Error general en /api/tickets:", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}