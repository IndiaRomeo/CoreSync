import { MercadoPagoConfig, Payment } from "mercadopago";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const payment = new Payment(client);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    console.log("📩 Webhook MP headers:", req.headers);
    console.log("📩 Webhook MP body:", req.body);

    // MP puede mandar el id en varios formatos, cubrimos los más comunes
    const paymentId =
      req.body?.data?.id ||
      req.query["data.id"] ||
      req.body?.id ||
      req.query.id;

    if (!paymentId) {
      console.warn("⚠️ Webhook MP sin paymentId válido");
      return res.status(200).send("No payment id");
    }

    // 1) Consultar el pago en la API de Mercado Pago
    const mpPayment = await payment.get({ id: paymentId.toString() });
    console.log("✅ Detalle pago MP:", mpPayment);

    const externalRef = mpPayment.external_reference; // = id de nuestra entrada
    const status = mpPayment.status; // approved, pending, rejected, etc.

    if (!externalRef) {
      console.warn("⚠️ Payment sin external_reference, no se puede mapear a entrada");
      return res.status(200).send("No external_reference");
    }

    // 2) Actualizar la entrada en Supabase
    const { error: updateError } = await supabaseAdmin
      .from("entradas")
      .update({
        status_pago: status,        // "approved" si todo salió bien
        mp_payment_id: paymentId,   // guardamos el id del pago
        paid_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", externalRef);

    if (updateError) {
      console.error("❌ Error actualizando entrada en Supabase:", updateError);
      return res.status(500).send("Error updating DB");
    }

    console.log(
      `🎟️ Entrada ${externalRef} actualizada a estado ${status} (paymentId: ${paymentId})`
    );

    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Error en webhook MP:", error);
    return res.status(500).send("ERROR");
  }
}