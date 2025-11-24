import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import QRCode from "qrcode";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ---------- CONFIG DEL EVENTO (AJUSTA ESTO A TU CASO) ----------
const EVENT_NAME =
  process.env.EVENT_NAME || "Noche de Velitas – Techno Edition";
const EVENT_DATE =
  process.env.EVENT_DATE || "2024-12-06T21:00:00-05:00"; // ISO string
const EVENT_LOCATION =
  process.env.EVENT_LOCATION || "Quinta (Core Sync · Mariquita, Tolima)";
const TICKET_PRICE = Number(process.env.TICKET_PRICE || 21999);
const TICKET_CURRENCY = process.env.TICKET_CURRENCY || "COP";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://collectivecoresync.com";

const resend = new Resend(process.env.RESEND_API_KEY);

// ---------- UTIL: generar código único ----------
function generarCodigo() {
  const random = Math.floor(100000 + Math.random() * 900000); // 6 dígitos
  return `CS-${random}`;
}

// ---------- UTIL: generar QR con logo ----------
async function generarQrConLogo({ codigo, nombre, telefono, email }) {
  const qrContent = `CoreSync|${codigo}|${nombre}|${telefono}|${email}`;

  // QR base
  const qrBuffer = await QRCode.toBuffer(qrContent, {
    color: { dark: "#000000", light: "#ffffff" },
    margin: 2,
    width: 320,
  });

  // Logo desde /public/logo-qr.png
  const logoPath = path.join(process.cwd(), "public/logo-qr.png");
  const logoExists = fs.existsSync(logoPath);

  if (!logoExists) {
    // Si no hay logo, devolvemos solo el QR
    return "data:image/png;base64," + qrBuffer.toString("base64");
  }

  let logoBuffer = fs.readFileSync(logoPath);
  logoBuffer = await sharp(logoBuffer).resize(80, 80).png().toBuffer();

  const qrWithLogoBuffer = await sharp(qrBuffer)
    .composite([
      {
        input: logoBuffer,
        top: Math.round(320 / 2 - 40),
        left: Math.round(320 / 2 - 40),
      },
    ])
    .png()
    .toBuffer();

  return "data:image/png;base64," + qrWithLogoBuffer.toString("base64");
}

// ---------- UTIL: mismo HTML bonito del webhook (adaptado) ----------
function buildTicketEmailHtml(entry, ticketPdfUrl) {
  const eventDate = new Date(entry.event_date);
  const eventDateLabel = eventDate.toLocaleString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const priceLabel = `${entry.divisa} $${entry.importe.toLocaleString(
    "es-CO"
  )}`;

  const htmlBody = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Tu ticket digital — Core Sync Collective</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark">
        <meta name="supported-color-schemes" content="dark">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #050509;
          }
        </style>
      </head>

      <body bgcolor="#050509" style="margin:0;padding:0;background-color:#050509;-webkit-text-size-adjust:100%;">
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          bgcolor="#050509"
          style="background-color:#050509;padding:24px 0;"
        >
          <tr>
            <td align="center" bgcolor="#050509" style="background-color:#050509;">

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  max-width:560px;
                  background:#050509;
                  border-radius:18px;
                  overflow:hidden;
                  border:1px solid #111827;
                  box-shadow:0 0 22px #00000044;
                "
              >

                <tr>
                  <td
                    style="
                      padding:10px 0;
                      text-align:center;
                      background:#0a0a0f;
                      border-bottom:1px solid #111827;
                    "
                  >
                    <span style="color:#6b7280;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;">
                      CORE SYNC DIGITAL TICKET • VERIFIED
                    </span>
                  </td>
                </tr>

                <tr>
                  <td>
                    <div style="height:4px;background:linear-gradient(90deg,#f97316,#f43f5e,#8b5cf6);"></div>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:24px 24px 16px 24px;
                      background:radial-gradient(circle at top,#22c55e33,#020617);
                      border-bottom:1px solid #111827;
                    "
                  >
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="left" valign="middle">
                          <img
                            src="${BASE_URL}/core-sync-log-navidad.png"
                            alt="Logo Core Sync Collective"
                            width="48"
                            height="48"
                            style="display:block;border-radius:999px;border:1px solid #22c55e33;"
                          />
                        </td>
                        <td align="right" valign="middle">
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

                <tr>
                  <td style="padding:24px;background:#050509;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#f9fafb;">
                      Hola ${entry.buyer_name || "raver"},
                    </h1>
                    <p style="margin:12px 0;font-size:14px;color:#e5e7eb;">
                      Gracias por apoyar <strong>Core Sync Collective</strong>.
                    </p>
                    <p style="margin:0;font-size:13px;color:#e5e7eb;">
                      Este ticket fue registrado manualmente por el equipo de Core Sync (pago por WhatsApp).
                    </p>
                    <p style="margin:8px 0 0 0;font-size:13px;color:#9ca3af;">
                      Preséntalo en tu celular o impreso al ingreso del evento.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 24px 24px 24px;background:#050509;">
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        border-radius:14px;
                        background:linear-gradient(135deg,#020617,#111827);
                        border:1px solid #1f2937;
                      "
                    >
                      <tr>
                        <td style="padding:18px;" valign="top">
                          <div style="font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:0.16em;">
                            Entrada digital
                          </div>
                          <div style="margin-top:4px;font-size:16px;font-weight:700;color:#f9fafb;">
                            ${entry.event_name}
                          </div>
                          <div style="margin-top:4px;font-size:13px;color:#e5e7eb;">
                            ${eventDateLabel}
                          </div>
                          <div style="font-size:12px;color:#9ca3af;">
                            ${entry.event_location}
                          </div>

                          <div style="margin-top:8px;color:#6b7280;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;">
                            EVENT ID: CS-${entry.codigo}
                          </div>
                        </td>

                        <td style="padding:18px;" align="right" valign="top">
                          <div style="font-size:11px;color:#9ca3af;">Importe</div>
                          <div style="font-size:15px;font-weight:700;color:#a855f7;">
                            ${priceLabel}
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td colspan="2" style="padding:14px 18px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td valign="top">
                                <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;">
                                  Código de ticket
                                </div>
                                <div style="font-family:monospace;font-size:15px;font-weight:700;color:#f97316;">
                                  ${entry.codigo}
                                </div>
                              </td>
                              <td align="right" valign="top">
                                <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;">
                                  Seguridad
                                </div>
                                <div style="font-family:monospace;font-size:15px;font-weight:700;color:#22c55e;">
                                  ${entry.security_code}
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding:0 24px 24px 24px;background:#050509;">
                    <a
                      href="${ticketPdfUrl}"
                      style="
                        display:inline-block;
                        padding:10px 22px;
                        border-radius:999px;
                        background:#f97316;
                        color:#050509;
                        font-size:13px;
                        font-weight:700;
                        text-decoration:none;
                        letter-spacing:0.12em;
                        text-transform:uppercase;
                      "
                    >
                      Descargar Ticket (PDF)
                    </a>
                    <div style="margin-top:10px;font-size:11px;color:#6b7280;">
                      Si el botón no funciona, copia y pega este enlace en tu navegador:
                    </div>
                    <div style="margin-top:4px;font-size:11px;color:#9ca3af;word-break:break-all;">
                      ${ticketPdfUrl}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 24px;background:#050509;">
                    <div
                      style="
                        margin:0 auto;
                        height:1px;
                        width:100%;
                        margin-bottom:12px;
                        background:repeating-linear-gradient(
                          90deg,
                          #4b5563 0px,
                          #4b5563 6px,
                          transparent 6px,
                          transparent 12px
                        );
                      "
                    ></div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px;border-top:1px solid #111827;background:#050509;">
                    <div style="font-size:11px;color:#4b5563;line-height:1.5;">
                      Core Sync Collective · Producción Techno<br />
                      Soporte:
                      <a href="mailto:collectivecoresync@gmail.com" style="color:#9ca3af;text-decoration:none;">
                        collectivecoresync@gmail.com
                      </a>
                      <br />
                      <span style="color:#6b7280;font-size:10px;">
                        Por favor no compartas este correo. Tu ticket es personal e intransferible.
                      </span>
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

  return htmlBody;
}

// ---------- HANDLER PRINCIPAL ----------
export async function POST(req) {
  // 1) Verificar que sea admin (cookie admin_auth = "1")
  const cookieStore = cookies();
  const auth = cookieStore.get("admin_auth");
  if (!auth || auth.value !== "1") {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const nombre = (body.nombre || "").trim();
    const email = (body.email || "").trim();
    const telefono = (body.telefono || "").trim();

    // 2) Validaciones básicas (lado servidor)
    if (!nombre || !email || !telefono) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    // Nombre solo letras / espacios
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ ]{2,50}$/.test(nombre)) {
      return NextResponse.json(
        { ok: false, error: "El nombre no es válido." },
        { status: 400 }
      );
    }

    if (!/^[0-9]{8,15}$/.test(telefono)) {
      return NextResponse.json(
        { ok: false, error: "El teléfono debe tener entre 8 y 15 dígitos numéricos." },
        { status: 400 }
      );
    }

    if (!/^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "El email no es válido." },
        { status: 400 }
      );
    }

    // 3) Generar código y QR
    const codigo = generarCodigo();

    // Security code derivado del código (igual estilo que en webhook)
    const codigoString = String(codigo ?? "");
    const securityBase = codigoString.replace(/[^0-9A-Za-z]/g, "");
    const securityCode =
      securityBase.length >= 6
        ? securityBase.slice(-6)
        : securityBase.padStart(6, "0");

    const qrBase64 = await generarQrConLogo({
      codigo,
      nombre,
      telefono,
      email,
    });

    const nowIso = new Date().toISOString();

    // 4) Insertar en Supabase (entrada manual pagada por WhatsApp)
    const rowToInsert = {
      buyer_name: nombre,
      buyer_email: email,
      buyer_phone: telefono,
      event_name: EVENT_NAME,
      event_date: EVENT_DATE,
      event_location: EVENT_LOCATION,
      importe: TICKET_PRICE,
      divisa: TICKET_CURRENCY,
      status_pago: "aprobado", // ✅ QR válido para /validate
      codigo,
      qr_base64: qrBase64,
      security_code: securityCode,
      created_at: nowIso,
      paid_at: nowIso,
      ticket_email_sent_at: nowIso,
      mp_preference_id: null,
      mp_payment_id: null,
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("entradas")
      .insert(rowToInsert)
      .select("id")
      .single();

    if (insertError) {
      console.error("❌ Error insertando entrada manual:", insertError);
      return NextResponse.json(
        { ok: false, error: "Error guardando el ticket" },
        { status: 500 }
      );
    }

    const entradaId = insertData.id;

    // 5) Construir URL del PDF (mismo endpoint que MercadoPago)
    const ticketPdfUrl = `${BASE_URL}/api/boleta-pdf-from-db?id=${entradaId}`;

    // 6) Enviar email con Resend (igual estilo al webhook)
    try {
      const entryForMail = {
        ...rowToInsert,
        id: entradaId,
      };

      const htmlBody = buildTicketEmailHtml(entryForMail, ticketPdfUrl);

      const { error: resendError } = await resend.emails.send({
        from:
          process.env.TICKETS_FROM_EMAIL ||
          "Core Sync Collective - Tickets <tickets@collectivecoresync.com>",
        to: email,
        subject: `Tu ticket para ${entryForMail.event_name}`,
        html: htmlBody,
        attachments: [
          {
            filename: `ticket-${entryForMail.codigo}.pdf`,
            path: ticketPdfUrl,
          },
        ],
      });

      if (resendError) {
        console.error("❌ Error enviando ticket manual por email:", resendError);
      } else {
        console.log(`📧 Ticket manual enviado a ${email}`);
      }
    } catch (mailErr) {
      console.error("❌ Error en envío de email manual:", mailErr);
    }

    // 7) Respuesta para el front
    return NextResponse.json({
      ok: true,
      id: entradaId,
      codigo,
      nombre,
      telefono,
      email,
      estado: "Pagado",
      qrBase64,
    });
  } catch (e) {
    console.error("❌ Error en /api/register-buyer:", e);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 }
    );
  }
}