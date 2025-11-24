import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  // Protección básica: solo admin con cookie
  const cookieStore = cookies();
  const auth = cookieStore.get("admin_auth");
  if (!auth || auth.value !== "1") {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    // Lee todas las entradas desde Supabase
    const { data, error } = await supabaseAdmin
      .from("entradas")
      .select(
        `
        codigo,
        buyer_name,
        buyer_phone,
        buyer_email,
        status_pago,
        qr_base64,
        qr_usado
      `
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error leyendo entradas en /api/tickets:", error);
      return NextResponse.json(
        { ok: false, error: "Error leyendo entradas" },
        { status: 500 }
      );
    }

    const tickets =
      (data || []).map((row) => {
        // Normalizar Estado para que coincida con lo que usa el panel
        let estado = "Reservado";
        const sp = (row.status_pago || "").toLowerCase();

        if (sp === "aprobado") estado = "Pagado";
        else if (sp === "rechazado") estado = "Rechazado";
        // cualquier otro (pendiente, null, etc.) lo tratamos como "Reservado"

        // Normalizar Qr usado -> "SI" / "NO"
        const qrUsadoRaw = (row.qr_usado || "").toString().trim().toLowerCase();
        const qrUsado = qrUsadoRaw === "si" ? "SI" : "NO";

        return {
          Código: row.codigo || "",
          Nombre: row.buyer_name || "",
          Teléfono: row.buyer_phone || "",
          Email: row.buyer_email || "",
          Estado: estado,
          "Qr usado": qrUsado,
          Qr: row.qr_base64 || "",
        };
      }) || [];

    return NextResponse.json({ ok: true, tickets });
  } catch (e) {
    console.error("❌ Error general en /api/tickets:", e);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 }
    );
  }
}