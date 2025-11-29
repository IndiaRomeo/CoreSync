export function buildTicketEmailHtml(entry, ticketPdfUrl, BASE_URL) {
  const eventDate = new Date(entry.event_date);
  const eventDateLabel = eventDate.toLocaleString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Bogota",
  });

  const priceLabel = `${entry.divisa} $${entry.importe.toLocaleString("es-CO")}`;

  // 🔐 Derivar código de seguridad si viene null en la BD
  const codigoString = String(entry.codigo ?? "");
  const securityBase = codigoString.replace(/[^0-9A-Za-z]/g, "");
  const derivedSecurity =
    securityBase.length >= 6
      ? securityBase.slice(-6)
      : securityBase.padStart(6, "0");

  const securityCode = entry.security_code || derivedSecurity;

  return `
  <!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Tu ticket digital — Core Sync Collective</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="dark">
      <meta name="supported-color-schemes" content="dark">
      <style>
        body { margin: 0; padding: 0; background-color: #050509; }
      </style>
    </head>

    <body bgcolor="#050509" style="margin:0;padding:0;background-color:#050509;-webkit-text-size-adjust:100%;">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#050509" style="padding:24px 0;">
        <tr>
          <td align="center">

            <table width="100%" cellpadding="0" cellspacing="0" style="
                max-width:560px;
                background:#050509;
                border-radius:18px;
                overflow:hidden;
                border:1px solid #111827;
                box-shadow:0 0 22px #00000044;
              ">

              <tr>
                <td style="padding:10px 0;text-align:center;background:#0a0a0f;border-bottom:1px solid #111827;">
                  <span style="color:#6b7280;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;">
                    CORE SYNC DIGITAL TICKET • VERIFIED
                  </span>
                </td>
              </tr>

              <tr><td><div style="height:4px;background:linear-gradient(90deg,#f97316,#f43f5e,#8b5cf6);"></div></td></tr>

              <tr>
                <td style="
                  padding:24px 24px 16px 24px;
                  background:radial-gradient(circle at top,#22c55e33,#020617);
                  border-bottom:1px solid #111827;">
                  
                  <table width="100%">
                    <tr>
                      <td align="left">
                        <img src="${BASE_URL}/core-sync-log-navidad.png"
                          width="48" height="48"
                          style="border-radius:999px;border:1px solid #22c55e33;" />
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

              <tr>
                <td style="padding:24px;">
                  <h1 style="margin:0;font-size:22px;font-weight:700;color:#f9fafb;">
                    Hola ${entry.buyer_name || "raver"},
                  </h1>
                  <p style="margin:12px 0;font-size:14px;color:#e5e7eb;">
                    Gracias por apoyar <strong>Core Sync Collective</strong>.
                  </p>
                  <p style="margin:0;font-size:13px;color:#9ca3af;">
                    Adjuntamos tu ticket digital. Preséntalo en tu celular o impreso al ingreso del evento.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:0 24px 24px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="
                      border-radius:14px;
                      background:linear-gradient(135deg,#020617,#111827);
                      border:1px solid #1f2937;">
                    <tr>
                      <td style="padding:18px;">
                        <div style="font-size:11px;color:#6b7280;letter-spacing:0.16em;text-transform:uppercase;">
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
                          EVENT ID: ${entry.codigo}
                        </div>
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
                              <div style="font-family:monospace;font-size:15px;font-weight:700;color:#f97316;">
                                ${entry.codigo}
                              </div>
                            </td>
                            <td align="right">
                              <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;">Seguridad</div>
                              <div style="font-family:monospace;font-size:15px;font-weight:700;color:#22c55e;">
                                ${securityCode}
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
                <td align="center" style="padding:0 24px 24px 24px;">
                  <a href="${ticketPdfUrl}" style="
                      display:inline-block;
                      padding:10px 22px;
                      border-radius:999px;
                      background:#f97316;
                      color:#050509;
                      font-size:13px;
                      font-weight:700;
                      text-decoration:none;
                      letter-spacing:0.12em;
                      text-transform:uppercase;">
                    Descargar Ticket (PDF)
                  </a>

                  <div style="margin-top:10px;font-size:11px;color:#6b7280;">
                    Si el botón no funciona, copia y pega este enlace:
                  </div>
                  <div style="margin-top:4px;font-size:11px;color:#9ca3af;word-break:break-all;">
                    ${ticketPdfUrl}
                  </div>
                </td>
              </tr>

              <tr><td style="padding:0 24px;">
                <div style="
                  margin:0 auto;height:1px;width:100%;margin-bottom:12px;
                  background:repeating-linear-gradient(
                    90deg,#4b5563 0px,#4b5563 6px,transparent 6px,transparent 12px
                  );
                "></div>
              </td></tr>

              <tr>
                <td style="padding:24px;border-top:1px solid #111827;background:#050509;">
                  <div style="font-size:11px;color:#4b5563;line-height:1.5;">
                    Core Sync Collective · Producción Techno<br />
                    Soporte:
                    <a href="mailto:collectivecoresync@gmail.com" style="color:#9ca3af;text-decoration:none;">
                      collectivecoresync@gmail.com
                    </a><br />
                    <span style="color:#6b7280;font-size:10px;">
                      No compartas este correo. Tu ticket es personal e intransferible.
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
}