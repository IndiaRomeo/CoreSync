import { pdf } from "@react-pdf/renderer";
import TicketPDF from "../../../pdf/TicketPDF";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function formatEventDateLabel(rawDate) {
  if (!rawDate) return "";

  const iso = String(rawDate);

  const match = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/
  );

  if (!match) return iso;

  const [, year, month, day, hour, minute] = match;

  const meses = {
    "01": "enero",
    "02": "febrero",
    "03": "marzo",
    "04": "abril",
    "05": "mayo",
    "06": "junio",
    "07": "julio",
    "08": "agosto",
    "09": "septiembre",
    "10": "octubre",
    "11": "noviembre",
    "12": "diciembre",
  };

  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? "p. m." : "a. m.";
  h = h % 12 || 12;

  return `${day} de ${meses[month]} de ${year}, ${String(h).padStart(2, "0")}:${minute} ${ampm}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { id } = req.query;
  if (!id) return res.status(400).send("Falta id");

  const { data, error } = await supabaseAdmin
    .from("entradas")
    .select(
      "buyer_name, event_name, event_date, event_location, codigo, importe, divisa, qr_base64, security_code"
    )
    .eq("id", id)
    .single();

  if (error || !data) return res.status(404).send("Ticket no encontrado");

  // 1) Fecha formateada SIN reconvertir zona horaria
  const eventDateLabel = formatEventDateLabel(data.event_date);

  // 2) Precio formateado
  const priceLabel = `${data.divisa} $${data.importe.toLocaleString("es-CO")}`;

  // 3) QR: limpiar el base64 por si viene como data:image/png;base64,...
  let qrBase64 = data.qr_base64 || "";
  qrBase64 = qrBase64.replace(/^data:image\/\w+;base64,/, "");

  // 4) Código de seguridad
  let securityCode = data.security_code;
  if (!securityCode) {
    const codigoString = String(data.codigo ?? "");
    const securityBase = codigoString.replace(/[^0-9A-Za-z]/g, "");

    securityCode =
      securityBase.length >= 6
        ? securityBase.slice(-6)
        : securityBase.padStart(6, "0");

    await supabaseAdmin
      .from("entradas")
      .update({ security_code: securityCode })
      .eq("id", id);
  }

  // 5) Construir PDF
  const doc = (
    <TicketPDF
      buyerName={data.buyer_name}
      eventName={data.event_name}
      eventDateLabel={eventDateLabel}
      eventLocation={data.event_location}
      codigo={data.codigo}
      priceLabel={priceLabel}
      qrBase64={qrBase64}
      logoUrl="https://collectivecoresync.com/core-sync-logo.png"
      securityCode={securityCode}
    />
  );

  const pdfBuffer = await pdf(doc).toBuffer();

  // 6) Respuesta
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="ticket-${data.codigo}.pdf"`
  );
  return res.send(pdfBuffer);
}