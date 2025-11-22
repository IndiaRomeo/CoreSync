import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const preference = new Preference(client);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const { titulo, precio, entradaId } = req.body;

    const baseUrl = "https://collectivecoresync.com";

    const result = await preference.create({
      body: {
        items: [
          {
            // ⬅️ CÓDIGO DEL ÍTEM (obligatorio para subir puntos)
            id: entradaId || "ticket-general", 

            title: titulo ?? "Entrada evento",

            // ⬅️ DESCRIPCIÓN DEL ÍTEM (obligatorio)
            description:
              "Entrada digital oficial para el evento Core Sync Collective. Incluye QR único y validación en puerta.",

            quantity: 1,
            unit_price: Number(precio),
            currency_id: "COP",

            // ⬅️ CATEGORÍA DEL ÍTEM (obligatorio)
            category_id: "tickets",
          },
        ],

        external_reference: entradaId,
        notification_url: `${baseUrl}/api/mp-webhook`,

        back_urls: {
          success: `${baseUrl}/pago-exitoso`,
          failure: `${baseUrl}/pago-fallido`,
          pending: `${baseUrl}/pago-pendiente`,
        },

        auto_return: "approved",
      },
    });

    return res.status(200).json({
      preferenceId: result.id,
      initPoint: result.init_point,
    });
  } catch (error) {
    console.error("❌ Error creando preferencia MP:", error);
    return res.status(500).send("Error creando preferencia");
  }
}