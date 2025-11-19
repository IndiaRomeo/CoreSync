// pages/api/mp-preference.js
import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      title = "Pago servicio legal",
      quantity = 1,
      unit_price = 25000, // en COP
      currency_id = "COP",
    } = req.body || {};

    const preference = await mercadopago.preferences.create({
      items: [
        {
          title,
          quantity,
          unit_price,
          currency_id,
        },
      ],
      back_urls: {
        success: "https://collectivecoresync.com/pago-exitoso",
        failure: "https://collectivecoresync.com/pago-fallido",
        pending: "https://collectivecoresync.com/pago-pendiente",
      },
      auto_return: "approved",
    });

    return res.status(200).json({
      id: preference.body.id,
      init_point: preference.body.init_point,              // URL de pago (producción)
      sandbox_init_point: preference.body.sandbox_init_point, // URL sandbox
    });
  } catch (error) {
    console.error("Error creando preferencia MP:", error);
    return res.status(500).json({ error: "Error creando preferencia" });
  }
}