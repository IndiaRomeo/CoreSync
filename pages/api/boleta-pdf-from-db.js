import { pdf } from "@react-pdf/renderer";
import TicketPDF from "../../pdf/TicketPDF";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

  // 1) Fecha formateada
  const eventDate = new Date(data.event_date);
  const eventDateLabel = eventDate.toLocaleString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 2) Precio formateado
  const priceLabel = `${data.divisa} $${data.importe.toLocaleString("es-CO")}`;

  // 3) QR: limpiar el base64 por si viene como data:image/png;base64,...
  let qrBase64 = data.qr_base64 || "";
  qrBase64 = qrBase64.replace(/^data:image\/\w+;base64,/, "");

  // 4) Código de seguridad (si no existe aún en la BD)
  let securityCode = data.security_code;
  if (!securityCode) {
    const codigoString = String(data.codigo ?? "");
    const securityBase = codigoString.replace(/[^0-9A-Za-z]/g, "");

    securityCode =
      securityBase.length >= 6
        ? securityBase.slice(-6)
        : securityBase.padStart(6, "0");

    // Guardarlo en BD para futuras validaciones / check-in
    await supabaseAdmin
      .from("entradas")
      .update({ security_code: securityCode })
      .eq("id", id);
  }

  // 5) Construir el PDF con el mismo diseño premium
  const doc = (
    <TicketPDF
      buyerName={data.buyer_name}
      eventName={data.event_name}
      eventDateLabel={eventDateLabel}
      eventLocation={data.event_location}
      codigo={data.codigo}
      priceLabel={priceLabel}
      qrBase64={qrBase64}
      logoUrl="https://collectivecoresync.com/core-sync-log-navidad.png"
      securityCode={securityCode}
    />
  );

  const pdfBuffer = await pdf(doc).toBuffer();

  // 6) Respuesta HTTP correcta
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="ticket-${data.codigo}.pdf"`
  );
  return res.send(pdfBuffer);
}