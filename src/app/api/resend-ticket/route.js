import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Resend } from "resend";
import { buildTicketEmailHtml } from "@/lib/buildTicketEmailHtml";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://collectivecoresync.com";

export async function POST(req) {
  try {
    const body = await req.json();
    const { codigo } = body;

    if (!codigo) {
      return NextResponse.json(
        { ok: false, error: "Falta código" },
        { status: 400 }
      );
    }

    // Buscar la entrada por código
    const { data, error } = await supabaseAdmin
      .from("entradas")
      .select(
        `
        id,
        buyer_name,
        buyer_email,
        event_name,
        event_date,
        event_location,
        codigo,
        importe,
        divisa,
        qr_base64,
        security_code,
        ticket_email_sent_at
      `
      )
      .eq("codigo", codigo)
      .limit(1);

    if (error) {
      console.error("❌ Error buscando entrada para resend:", error);
      return NextResponse.json(
        { ok: false, error: "Error leyendo entrada" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No existe entrada con ese código" },
        { status: 404 }
      );
    }

    const entry = data[0];

    const toEmail = entry.buyer_email;
    if (!toEmail) {
      return NextResponse.json(
        { ok: false, error: "La entrada no tiene buyer_email" },
        { status: 400 }
      );
    }

    // URL al PDF desde Supabase
    const ticketPdfUrl = `${BASE_URL}/api/boleta-pdf-from-db?id=${entry.id}`;

    // HTML con tu helper
    const htmlBody = buildTicketEmailHtml(entry, ticketPdfUrl, BASE_URL);

    const { error: resendError } = await resend.emails.send({
      from:
        process.env.TICKETS_FROM_EMAIL ||
        "Core Sync Collective - Tickets <tickets@collectivecoresync.com>",
      to: toEmail,
      subject: `Tu ticket para ${entry.event_name}`,
      html: htmlBody,
      attachments: [
        {
          filename: `ticket-${entry.codigo}.pdf`,
          path: ticketPdfUrl,
        },
      ],
    });

    if (resendError) {
      console.error("❌ Error reenviando ticket (Resend):", resendError);
      return NextResponse.json(
        { ok: false, error: "Error enviando email" },
        { status: 500 }
      );
    }

    // Actualizar fecha de último envío de ticket
    await supabaseAdmin
      .from("entradas")
      .update({ ticket_email_sent_at: new Date().toISOString() })
      .eq("id", entry.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("❌ Error general en /api/resend-ticket:", e);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 }
    );
  }
}