import { Resend } from "resend";

export default async function handler(req, res) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const r = await resend.emails.send({
      from: process.env.TICKETS_FROM_EMAIL,
      to: "exclusivecp24@gmail.com",
      subject: "Prueba desde Core Sync",
      html: "<h1>Todo OK 🔥</h1><p>El dominio ya envía correos.</p>",
    });

    return res.status(200).json(r);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}