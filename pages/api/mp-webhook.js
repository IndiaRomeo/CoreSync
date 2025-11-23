import { MercadoPagoConfig, Payment } from "mercadopago";
import { pdf } from "@react-pdf/renderer";
import { Resend } from "resend";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import TicketPDF from "../../pdf/TicketPDF"; // mismo componente que usas en boleta-pdf-from-db

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

    // MP puede enviar el id del pago en distintos lugares:
    const paymentId =
      req.body?.data?.id ||
      req.body?.id ||
      req.query?.id;

    if (!paymentId) {
      console.log("⚠️ Webhook sin paymentId, se ignora");
      return res.status(200).send("No payment id");
    }

    // 1) Consultar el pago en Mercado Pago
    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: String(paymentId) });

    console.log("✅ Detalle del pago MP:", paymentInfo);

    const externalRef = paymentInfo.external_reference; // id de nuestra tabla entradas
    const mpStatus = paymentInfo.status;               // approved / rejected / pending...
    const mpPaymentId = paymentInfo.id?.toString();

    if (!externalRef) {
      console.log("⚠️ Pago sin external_reference, no se puede enlazar a la entrada");
      return res.status(200).send("No external_reference");
    }

    // Datos del comprador que vengan desde MP (por si quieres completarlos)
    const payer = paymentInfo.payer || {};
    const buyer_email = payer.email || null;
    const buyer_name =
      [payer.first_name, payer.last_name].filter(Boolean).join(" ") || null;

    // 2) Traducimos el status de MP al nuestro
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

    // Datos para actualizar en Supabase
    const updateData = {
      status_pago,
      mp_payment_id: mpPaymentId,
      updated_at: new Date().toISOString(),
    };

    if (mpStatus === "approved") {
      updateData.paid_at =
        paymentInfo.date_approved || new Date().toISOString();
    }

    // Si MP trae nombre/correo, puedes completar lo que falte en la BD
    if (buyer_email) updateData.buyer_email = buyer_email;
    if (buyer_name) updateData.buyer_name = buyer_name;

    // 3) Actualizar la fila correspondiente en Supabase
    const { error: updateError } = await supabaseAdmin
      .from("entradas")
      .update(updateData)
      .eq("id", externalRef);

    if (updateError) {
      console.error("❌ Error actualizando entrada en Supabase:", updateError);
      // devolvemos 200 igual para que MP no reintente infinito
      return res.status(200).send("Error updating entry");
    }

    console.log(`🎟️ Entrada ${externalRef} marcada como ${status_pago}`);

    // 4) Si el pago quedó APROBADO ⇒ generar PDF y enviarlo por correo
    if (status_pago === "aprobado" && buyer_email) {
      try {
        // (Opcional pero recomendable: tener una columna ticket_email_sent_at para evitar duplicados)
        const { data: ticketRow, error: ticketError } = await supabaseAdmin
          .from("entradas")
          .select(
            "buyer_name, buyer_email, event_name, event_date, event_location, codigo, importe, divisa, qr_base64, security_code"
          )
          .eq("id", externalRef)
          .single();

        if (ticketError || !ticketRow) {
          console.error("⚠️ No se pudo leer la entrada para generar el PDF:", ticketError);
        } else {
          // Formatear fecha
          const eventDate = new Date(ticketRow.event_date);
          const eventDateLabel = eventDate.toLocaleString("es-CO", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const priceLabel = `${ticketRow.divisa} $${ticketRow.importe.toLocaleString(
            "es-CO"
          )}`;

          // Código de seguridad (si no está guardado, lo derivamos del código)
          const codigoString = String(ticketRow.codigo ?? "");
          const securityBase = codigoString.replace(/[^0-9A-Za-z]/g, "");
          const derivedSecurity =
            securityBase.length >= 6
              ? securityBase.slice(-6)
              : securityBase.padStart(6, "0");

          const securityCode = ticketRow.security_code || derivedSecurity;

          // Construir el PDF con el mismo diseño premium
          const doc = (
            <TicketPDF
              buyerName={ticketRow.buyer_name}
              eventName={ticketRow.event_name}
              eventDateLabel={eventDateLabel}
              eventLocation={ticketRow.event_location}
              codigo={ticketRow.codigo}
              priceLabel={priceLabel}
              qrBase64={ticketRow.qr_base64}
              logoUrl="/core-sync-logo.png"
              securityCode={securityCode}
            />
          );

          const pdfBuffer = await pdf(doc).toBuffer();

          // Enviar email con Resend
          // URL del PDF (por si quieres incluir enlace además del adjunto)
          const ticketPdfUrl = `https://collectivecoresync.com/api/boleta-pdf-from-db?id=${externalRef}`;

          // Template completo estilo Core Sync
          const htmlBody = `
          <!doctype html>
          <html lang="es">
            <head>
              <meta charset="utf-8" />
              <title>Tu ticket para ${ticketRow.event_name}</title>
            </head>
            <body style="margin:0;padding:0;background:#050509;color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#050509;padding:24px 0;">
                <tr>
                  <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0b0b10;border-radius:18px;overflow:hidden;border:1px solid #1f2937;">
                      
                      <!-- Header -->
                      <tr>
                        <td style="padding:24px 24px 16px 24px;background:radial-gradient(circle at top,#22c55e33,#020617);border-bottom:1px solid #111827;">
                          <table width="100%">
                            <tr>
                              <td align="left">
                                <img
                                  src="https://collectivecoresync.com/core-sync-logo.png"
                                  alt="Core Sync Collective"
                                  width="48"
                                  height="48"
                                  style="display:block;border-radius:999px;border:1px solid #22c55e33;"
                                />
                              </td>
                              <td align="right">
                                <div style="font-size:11px;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;">
                                  Core Sync Collective
                                </div>
                                <div style="margin-top:4px;font-size:13px;color:#e5e7eb;">
                                  Tu ticket está listo ⚡
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Mensaje principal -->
                      <tr>
                        <td style="padding:24px;">
                          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f9fafb;">
                            Hola ${ticketRow.buyer_name || "raver"},
                          </h1>
                          <p style="margin:12px 0;font-size:14px;color:#e5e7eb;">
                            Gracias por apoyar <strong>Core Sync Collective</strong>.
                          </p>
                          <p style="margin:0;font-size:13px;color:#9ca3af;">
                            Adjuntamos tu ticket digital. Preséntalo en tu celular o impreso.
                          </p>
                        </td>
                      </tr>

                      <!-- Tarjeta de ticket -->
                      <tr>
                        <td style="padding:0 24px 24px 24px;">
                          <table width="100%" style="border-radius:14px;background:linear-gradient(135deg,#020617,#111827);border:1px solid #1f2937;">
                            <tr>
                              <td style="padding:18px;">
                                <div style="font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:0.16em;">Entrada digital</div>
                                <div style="margin-top:4px;font-size:16px;font-weight:700;color:#f9fafb;">${ticketRow.event_name}</div>
                                <div style="margin-top:4px;font-size:13px;color:#e5e7eb;">${eventDateLabel}</div>
                                <div style="font-size:12px;color:#9ca3af;">${ticketRow.event_location}</div>
                              </td>
                              <td style="padding:18px;" align="right">
                                <div style="font-size:11px;color:#9ca3af;">Importe</div>
                                <div style="font-size:15px;font-weight:700;color:#a855f7;">
                                  ${priceLabel}
                                </div>
                              </td>
                            </tr>

                            <tr>
                              <td colspan="2" style="padding:14px 18px;">
                                <table width="100%">
                                  <tr>
                                    <td>
                                      <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;">Código de ticket</div>
                                      <div style="font-family:monospace;font-size:15px;font-weight:700;color:#f97316;">${ticketRow.codigo}</div>
                                    </td>
                                    <td align="right">
                                      <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;">Seguridad</div>
                                      <div style="font-family:monospace;font-size:15px;font-weight:700;color:#22c55e;">${securityCode}</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>

                          </table>
                        </td>
                      </tr>

                      <!-- Botón -->
                      <tr>
                        <td align="center" style="padding:0 24px 24px 24px;">
                          <a href="${ticketPdfUrl}"
                            style="display:inline-block;padding:10px 22px;border-radius:999px;background:#f97316;color:#050509;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.12em;">
                            Descargar Ticket (PDF)
                          </a>
                          <div style="margin-top:10px;font-size:11px;color:#6b7280;">
                            Si el botón no funciona, abre el archivo adjunto.
                          </div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="padding:24px;border-top:1px solid #111827;">
                          <div style="font-size:11px;color:#4b5563;">
                            Core Sync Collective · Producción Techno<br />
                            Soporte: <a href="mailto:collectivecoresync@gmail.com" style="color:#9ca3af;">collectivecoresync@gmail.com</a>
                          </div>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
          `;

          await resend.emails.send({
            from:
              process.env.TICKETS_FROM_EMAIL ||
              "Core Sync <onboarding@resend.dev>",
            to: ticketRow.buyer_email || buyer_email,
            subject: `Tu ticket para ${ticketRow.event_name}`,
            html: htmlBody,
            attachments: [
              {
                filename: `ticket-${ticketRow.codigo}.pdf`,
                content: pdfBuffer.toString("base64"),
                type: "application/pdf",
                disposition: "attachment",
              },
            ],
          });

          console.log(`📧 Ticket enviado a ${ticketRow.buyer_email || buyer_email}`);

          // (Opcional) marca en BD que ya se envió el mail para no duplicar
          await supabaseAdmin
            .from("entradas")
            .update({ ticket_email_sent_at: new Date().toISOString() })
            .eq("id", externalRef);
        }
      } catch (mailErr) {
        console.error("❌ Error enviando ticket por email:", mailErr);
        // IMPORTANTE: aun si falla el correo, respondemos 200 para que MP no reintente
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Error en webhook MP:", error);
    // importante devolver 200 para que MP no haga retry eterno
    return res.status(200).send("OK");
  }
}