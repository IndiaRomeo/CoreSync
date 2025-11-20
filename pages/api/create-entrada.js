import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const { nombre, email, evento } = req.body;

    const { data, error } = await supabaseAdmin
      .from("entradas")
      .insert({
        nombre,
        email,
        evento,
        status_pago: "pendiente",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creando entrada:", error);
      return res.status(500).send("Error creando entrada");
    }

    return res.status(200).json({ entradaId: data.id });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
}