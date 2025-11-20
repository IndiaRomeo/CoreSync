import { MercadoPagoConfig, Preference } from "mercadopago";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      title = "NOCHE DE VELITAS — Core Sync Collective",
      quantity = 1,
      unit_price = 1000, // COP
      currency_id = "COP",
      buyer_email,
      buyer_name,
      buyer_phone,
    } = req.body || {};

    // 1) Insertar la entrada en Supabase y obtener el id generado
    const { data, error: insertError } = await supabaseAdmin
      .from("entradas")
      .insert({
        importe: unit_price,
        divisa: currency_id,
        buyer_email,
        buyer_name,
        buyer_phone,
        status_pago: "pendiente",
        event_name: "NOCHE DE VELITAS — Core Sync Collective",
        event_date: "2025-12-06T21:00:00-05:00",
        event_location: "San Sebastián de Mariquita",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error insertando en Supabase:", insertError);
      return res.status(500).json({ error: "Error creando entrada" });
    }

    const ticketId = data.id; // uuid generado por la BD

    const preference = new Preference(client);

    // 👇 Detectamos si estamos en dev o producción
    const isDev = process.env.NODE_ENV !== "production";

    // 👇 URL a la que el usuario vuelve (local en dev, dominio en prod)
    const baseUrl = isDev
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_BASE_URL;

    // 👇 URL del webhook: siempre debe ser pública para que MP pueda entrar
    const notificationUrl = isDev
      ? "https://collectivecoresync.com/api/mp-web-hook"
      : `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp-web-hook`;

    const body = {
      items: [
        {
          title,
          quantity,
          unit_price,
          currency_id,
        },
      ],
      back_urls: {
        success: `${baseUrl}/pago-exitoso`,
        failure: `${baseUrl}/pago-fallido`,
        pending: `${baseUrl}/pago-pendiente`,
      },
      // auto_return lo dejamos apagado por ahora
      external_reference: ticketId,
      notification_url: notificationUrl,
    };

    console.log("MP Preference body:", body);

    // 2) Crear preferencia en Mercado Pago
    const result = await preference.create({ body });

    // 3) Guardar mp_preference_id en la entrada
    if (result.id) {
      await supabaseAdmin
        .from("entradas")
        .update({ mp_preference_id: result.id })
        .eq("id", ticketId);
    }

    return res.status(200).json({
      init_point: result.init_point || result.sandbox_init_point,
      ticketId,
    });
  } catch (error) {
    console.error("Error creando preferencia MP:", error);
    return res.status(500).json({ error: "Error creando preferencia" });
  }
}