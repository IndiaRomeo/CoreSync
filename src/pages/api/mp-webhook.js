import { MercadoPagoConfig, Payment } from "mercadopago";
import { Resend } from "resend";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildTicketEmailHtml } from "@/lib/buildTicketEmailHtml";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    console.log("📩 Webhook Mercado Pago — body:", req.body, "query:", req.query);

    const paymentId =
      req.body?.data?.id ||
      req.body?.id ||
      req.query?.id;

    if (!paymentId) {
      console.log("⚠️ Webhook sin paymentId, se ignora");
      return res.status(200).send("No payment id");
    }

    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: String(paymentId) });

    console.log("✅ Detalle del pago MP:", paymentInfo);

    const externalRef = paymentInfo.external_reference;
    const mpStatus = paymentInfo.status;
    const mpPaymentId = paymentInfo.id?.toString();

    if (!externalRef) {
      console.log("⚠️ Pago sin external_reference, no se puede enlazar a la entrada");
      return res.status(200).send("No external_reference");
    }

    let status_pago = "pendiente";
    switch (mpStatus) {
      case "approved":
        status_pago = "aprobado";
        break;
      case "rejected":
        status_pago = "rechazado";
        break;
      case "in_process":
      case "pending":
      default:
        status_pago = "pendiente";
        break;
    }

    const updateData = {
      status_pago,
      mp_payment_id: mpPaymentId,
      updated_at: new Date().toISOString(),
    };

    if (mpStatus === "approved") {
      updateData.paid_at =
        paymentInfo.date_approved || new Date().toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from("entradas")
      .update(updateData)
      .eq("id", externalRef);

    if (updateError) {
      console.error("❌ Error actualizando entrada en Supabase:", updateError);
      return res.status(200).send("Error updating entry");
    }

    console.log(`🎟️ Entrada ${externalRef} marcada como ${status_pago}`);

    if (status_pago === "aprobado") {
      try {
        const nowIso = new Date().toISOString();

        const { data: rows, error: ticketError } = await supabaseAdmin
          .from("entradas")
          .update({ ticket_email_sent_at: nowIso })
          .eq("id", externalRef)
          .is("ticket_email_sent_at", null)
          .select(
            "buyer_name, buyer_email, event_name, event_date, event_location, codigo, importe, divisa, qr_base64, security_code, ticket_email_sent_at"
          );

        if (ticketError) {
          console.error("⚠️ Error leyendo/actualizando entrada:", ticketError);
          return res.status(200).send("No ticket row");
        }

        if (!rows || rows.length === 0) {
          console.log(
            `📨 Ticket ${externalRef} ya tenía ticket_email_sent_at, no reenviamos.`
          );
          return res.status(200).send("Email already sent");
        }

        const ticketRow = rows[0];

        const payer = paymentInfo.payer || {};
        const payerEmail = payer.email || null;
        const toEmail = ticketRow.buyer_email || payerEmail;

        if (!toEmail) {
          console.log("⚠️ No hay buyer_email para enviar el ticket.");
          return res.status(200).send("No buyer email");
        }

        const ticketPdfUrl = `https://collectivecoresync.com/api/boleta-pdf-from-db?id=${externalRef}`;

        const htmlBody = buildTicketEmailHtml(
          ticketRow,
          ticketPdfUrl,
          "https://collectivecoresync.com"
        );

        const { data, error: resendError } = await resend.emails.send({
          from:
            process.env.TICKETS_FROM_EMAIL ||
            "Core Sync Collective - Tickets <tickets@collectivecoresync.com>",
          to: toEmail,
          subject: `Tu ticket para ${ticketRow.event_name}`,
          html: htmlBody,
          attachments: [
            {
              filename: `ticket-${ticketRow.codigo}.pdf`,
              path: ticketPdfUrl,
            },
          ],
        });

        if (resendError) {
          console.error(
            "❌ Error enviando ticket por email (Resend):",
            resendError
          );
        } else {
          console.log(`📧 Ticket enviado a ${toEmail}`, data);
        }
      } catch (mailErr) {
        console.error("❌ Error enviando ticket por email (try/catch):", mailErr);
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Error en webhook MP:", error);
    return res.status(200).send("OK");
  }
}