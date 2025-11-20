import { supabaseAdmin } from "@/lib/supabaseAdmin";
import QRCode from "qrcode";

// Genera un código de ticket tipo CS-123456
function generarCodigoTicket() {
  const n = Math.floor(100000 + Math.random() * 900000); // 6 dígitos
  return `CS-${n}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const {
      buyer_email,
      buyer_name,
      buyer_phone,
      importe,
      event_name,
      event_date,
      event_location,
    } = req.body;

    // 1) Generar código de ticket
    const codigo = generarCodigoTicket();

    // 2) Insertar la entrada (sin qr_base64 todavía)
    const { data, error } = await supabaseAdmin
      .from("entradas")
      .insert({
        mp_preference_id: null,
        mp_payment_id: null,
        status_pago: "pendiente",
        importe,
        divisa: "COP",
        buyer_email,
        buyer_name,
        buyer_phone,
        event_name,
        event_date,
        event_location,
        codigo,        // 👈 NUEVO
        qr_base64: null,
        qr_used_at: null,
        qr_used_by: null,
      })
      .select("id, codigo")
      .single();

    if (error || !data) {
      console.error("❌ Error creando entrada:", error);
      return res.status(500).json({ message: "Error creando entrada" });
    }

    const entradaId = data.id;

    // 3) Generar el texto del QR
    // Mantengo tu formato para el scanner: core-sync|CODIGO|ID
    const qrText = `core-sync|${data.codigo}|${entradaId}`;

    // 4) Generar imagen QR en base64
    const qr_base64 = await QRCode.toDataURL(qrText, {
      errorCorrectionLevel: "H",
    });

    // 5) Guardar el qr_base64 en la fila
    const { error: updError } = await supabaseAdmin
      .from("entradas")
      .update({ qr_base64 })
      .eq("id", entradaId);

    if (updError) {
      console.error("⚠️ Entrada creada pero error guardando qr_base64:", updError);
      // No rompemos el flujo; igual devolvemos la entrada
    }

    // 6) Devolvemos ID REAL + código (por si lo quieres usar)
    return res.status(200).json({
      entradaId,
      codigo: data.codigo,
    });
  } catch (err) {
    console.error("❌ Error en create-entrada:", err);
    return res.status(500).json({ message: "Server error" });
  }
}