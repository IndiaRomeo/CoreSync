import { NextResponse } from "next/server";
import QRCode from "qrcode";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildTicketEmailHtml } from "@/lib/buildTicketEmailHtml";
import { requireAdmin } from "@/lib/requireAdmin";

// ---------- CONFIG DEL EVENTO ----------
const EVENT_NAME =
  process.env.EVENT_NAME || "Noche de Velitas – Techno Edition";
const EVENT_DATE =
  process.env.EVENT_DATE || "2025-12-06T21:00:00-05:00"; // ISO
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

  const qrBuffer = await QRCode.toBuffer(qrContent, {
    color: { dark: "#000000", light: "#ffffff" },
    margin: 2,
    width: 320,
  });

  const logoPath = path.join(process.cwd(), "public/logo-qr.png");
  const logoExists = fs.existsSync(logoPath);

  if (!logoExists) {
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

// ---------- HANDLER PRINCIPAL ----------
export async function POST(req) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await req.json();
    const nombre = (body.nombre || "").trim();
    const email = (body.email || "").trim();
    const telefono = (body.telefono || "").trim();

    // 2) Validaciones básicas
    if (!nombre || !email || !telefono) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ ]{2,50}$/.test(nombre)) {
      return NextResponse.json(
        { ok: false, error: "El nombre no es válido." },
        { status: 400 }
      );
    }

    if (!/^[0-9]{8,15}$/.test(telefono)) {
      return NextResponse.json(
        {
          ok: false,
          error: "El teléfono debe tener entre 8 y 15 dígitos numéricos.",
        },
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

    // 4) Insertar en Supabase
    const rowToInsert = {
      buyer_name: nombre,
      buyer_email: email,
      buyer_phone: telefono,
      event_name: EVENT_NAME,
      event_date: EVENT_DATE,
      event_location: EVENT_LOCATION,
      importe: TICKET_PRICE,
      divisa: TICKET_CURRENCY,
      status_pago: "aprobado",
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

    // 5) URL del PDF
    const ticketPdfUrl = `${BASE_URL}/api/boleta-pdf-from-db?id=${entradaId}`;

    // 6) Enviar email usando helper compartido
    try {
      const entryForMail = {
        ...rowToInsert,
        id: entradaId,
      };

      const htmlBody = buildTicketEmailHtml(
        entryForMail,
        ticketPdfUrl,
        BASE_URL
      );

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