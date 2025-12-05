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
        codigo,
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

    // 3) Texto dentro del QR
    const qrText = `core-sync|${data.codigo}|${entradaId}`;

    // 4) Generar imagen QR
    const qr_base64 = await QRCode.toDataURL(qrText, {
      errorCorrectionLevel: "H",
    });

    // 5) Guardar QR
    const { error: updError } = await supabaseAdmin
      .from("entradas")
      .update({ qr_base64 })
      .eq("id", entradaId);

    if (updError) {
      console.error("⚠️ Entrada creada pero error guardando qr_base64:", updError);
    }

    // 6) Devolvemos ID + código
    return res.status(200).json({
      entradaId,
      codigo: data.codigo,
    });
  } catch (err) {
    console.error("❌ Error en create-entrada:", err);
    return res.status(500).json({ message: "Server error" });
  }
}