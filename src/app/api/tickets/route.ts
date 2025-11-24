import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function fmtDate(iso?: string | null) {
  return iso
    ? new Date(iso).toLocaleString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
}

export async function GET() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("admin_auth");

  if (!auth || auth.value !== "1") {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("entradas")
      .select(
        `
        id,
        codigo,
        buyer_name,
        buyer_phone,
        buyer_email,
        status_pago,
        importe,
        divisa,
        event_name,
        event_date,
        event_location,
        created_at,
        paid_at,
        qr_base64,
        qr_used_at,
        qr_used_by,
        ticket_email_sent_at
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
      (data ?? []).map((row) => {
        let estado = "Reservado";
        const sp = (row.status_pago || "").toLowerCase();
        if (sp === "aprobado") estado = "Pagado";
        else if (sp === "rechazado") estado = "Rechazado";

        const qrUsado = row.qr_used_at ? "SI" : "NO";

        return {
          Código: row.codigo || row.id || "",
          Nombre: row.buyer_name || "",
          Teléfono: row.buyer_phone || "",
          Email: row.buyer_email || "",
          Estado: estado,

          Importe:
            row.importe != null
              ? `${row.divisa || "COP"} $${Number(
                  row.importe
                ).toLocaleString("es-CO")}`
              : "",
          Evento: row.event_name || "",
          "Fecha evento": fmtDate(row.event_date),
          Lugar: row.event_location || "",
          "Fecha compra": fmtDate(row.created_at),
          "Fecha pago": fmtDate(row.paid_at),

          "Qr usado": qrUsado,
          "Fecha uso QR": fmtDate(row.qr_used_at),
          "Validador QR": row.qr_used_by || "",

          "Email ticket": fmtDate(row.ticket_email_sent_at),

          "Fecha compra ISO": row.created_at || "",
          Qr: row.qr_base64 || "",
        };
      }) ?? [];

    return NextResponse.json({ ok: true, tickets });
  } catch (e) {
    console.error("❌ Error general en /api/tickets:", e);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 }
    );
  }
}