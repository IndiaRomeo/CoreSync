// pages/api/boleta-pdf-from-db.js (ejemplo)
import { pdf } from "@react-pdf/renderer";
import TicketPDF from "@/pdf/TicketPDF";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { id } = req.query; // id = uuid de entradas

  const { data, error } = await supabaseAdmin
    .from("entradas")
    .select(
      "buyer_name, event_name, event_date, event_location, codigo, importe, divisa, qr_base64"
    )
    .eq("id", id)
    .single();

  if (error || !data) return res.status(404).send("Ticket no encontrado");

  const eventDate = new Date(data.event_date);

  // Formatea la fecha como string bonito (hazlo a tu gusto)
  const eventDateLabel = `06 diciembre 2025 — 9:00 PM`; // o usa dayjs/Intl en tu backend

  const priceLabel = `${data.divisa} $${data.importe.toLocaleString("es-CO")}`;

  const doc = (
    <TicketPDF
      buyerName={data.buyer_name}
      eventName={data.event_name}
      eventDateLabel={eventDateLabel}
      eventLocation={data.event_location}
      codigo={data.codigo}
      priceLabel={priceLabel}
      qrBase64={data.qr_base64}
      logoUrl="/core-sync-logo.png" // pon tu logo aquí (por ejemplo en /public)
    />
  );

  const pdfBuffer = await pdf(doc).toBuffer();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="ticket-${data.codigo}.pdf"`
  );
  return res.send(pdfBuffer);
}