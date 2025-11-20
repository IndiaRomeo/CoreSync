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

    const result = await preference.create({
      body: {
        items: [
          {
            title: titulo ?? "Entrada evento",
            quantity: 1,
            unit_price: Number(precio),
            currency_id: "COP",
          },
        ],
        external_reference: entradaId, // ID de tu tabla "entradas"
        notification_url: "https://collectivecoresync.com/api/mp-webhook",
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