import React from "react";
import { pdf } from "@react-pdf/renderer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import TicketPDF from "../../pdf/TicketPDF"; // mismo componente que ya usabas

async function generarPDF({ nombre, codigo, qrBase64 }) {
  const pdfDoc = pdf(
    <TicketPDF nombre={nombre} codigo={codigo} qrBase64={qrBase64} />
  );
  return await pdfDoc.toBuffer();
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { id } = req.query; // este id = uuid de entradas
  if (!id) return res.status(400).send("Falta id");

  const { data, error } = await supabaseAdmin
    .from("entradas")
    .select("buyer_name, codigo, qr_base64")
    .eq("id", id)
    .single();

  if (error || !data) return res.status(404).send("Entrada no encontrada");

  const pdfBuffer = await generarPDF({
    nombre: data.buyer_name,
    codigo: data.codigo,
    qrBase64: data.qr_base64,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="ticket#${data.codigo}.pdf"`
  );
  return res.status(200).send(pdfBuffer);
}