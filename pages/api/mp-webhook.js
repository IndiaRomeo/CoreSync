import { MercadoPagoConfig, Payment } from "mercadopago";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    console.log("📩 Webhook Mercado Pago — body:", req.body, "query:", req.query);

    // MP puede enviar el id del pago en distintos lugares:
    const paymentId =
      req.body?.data?.id ||
      req.body?.id ||
      req.query?.id;

    if (!paymentId) {
      console.log("⚠️ Webhook sin paymentId, se ignora");
      return res.status(200).send("No payment id");
    }

    // 1) Consultar el pago en Mercado Pago
    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: String(paymentId) });

    console.log("✅ Detalle del pago MP:", paymentInfo);

    const externalRef = paymentInfo.external_reference; // id de nuestra tabla
    const mpStatus = paymentInfo.status;               // approved / rejected / pending...
    const mpPaymentId = paymentInfo.id?.toString();

    if (!externalRef) {
      console.log("⚠️ Pago sin external_reference, no se puede enlazar a la entrada");
      return res.status(200).send("No external_reference");
    }

    // 2) Traducimos el status de MP al nuestro
    let status_pago = "pendiente";
    switch (mpStatus) {
      case "approved":
        status_pago = "aprobado";
        break;
      case "rejected":
        status_pago = "rechazado";
        break;
      case "in_process":
      case "pending":
      default:
        status_pago = "pendiente";
        break;
    }

    const updateData = {
      status_pago,
      mp_payment_id: mpPaymentId,
      updated_at: new Date().toISOString(),
    };

    if (mpStatus === "approved") {
      updateData.paid_at =
        paymentInfo.date_approved || new Date().toISOString();
    }

    // 3) Actualizar la fila correspondiente en Supabase
    const { error: updateError } = await supabaseAdmin
      .from("entradas")
      .update(updateData)
      .eq("id", externalRef);

    if (updateError) {
      console.error("❌ Error actualizando entrada en Supabase:", updateError);
      // devolvemos 200 igual para que MP no reintente infinito
      return res.status(200).send("Error updating entry");
    }

    console.log(`🎟️ Entrada ${externalRef} marcada como ${status_pago}`);

    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Error en webhook MP:", error);
    // importante devolver 200 para que MP no haga retry eterno
    return res.status(200).send("OK");
  }
}