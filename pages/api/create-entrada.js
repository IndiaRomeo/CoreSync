import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

    const { data, error } = await supabaseAdmin
      .from("entradas")
      .insert({
        // Supabase genera "id" automáticamente (uuid)
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
      })
      .select("id") // solo necesitamos el id generado
      .single();

    if (error) {
      console.error("❌ Error creando entrada:", error);
      return res.status(500).json({ message: "Error creando entrada" });
    }

    // devolvemos el ID REAL de la tabla entradas
    return res.status(200).json({ entradaId: data.id });
  } catch (err) {
    console.error("❌ Error en create-entrada:", err);
    return res.status(500).json({ message: "Server error" });
  }
}