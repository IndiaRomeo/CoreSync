import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { codigo, validador } = req.query;
  if (!codigo) return res.status(400).json({ ok: false, error: "Falta código" });

  const { data, error } = await supabaseAdmin
    .from("entradas")
    .select("buyer_name, buyer_phone, buyer_email, status_pago, qr_used_at")
    .eq("codigo", codigo)
    .single();

  if (error || !data) {
    return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
  }

  if (data.status_pago !== "aprobado") {
    return res.status(400).json({ ok: false, error: "Ticket no pagado" });
  }

  if (data.qr_used_at) {
    return res.status(400).json({ ok: false, error: "Este ticket ya fue usado." });
  }

  // marcar como usado
  const { error: updError } = await supabaseAdmin
    .from("entradas")
    .update({
      qr_used_at: new Date().toISOString(),
      qr_used_by: validador || null,
    })
    .eq("codigo", codigo);

  if (updError) {
    return res.status(500).json({ ok: false, error: "Error registrando uso" });
  }

  return res.status(200).json({
    ok: true,
    codigo,
    nombre: data.buyer_name,
    telefono: data.buyer_phone,
    email: data.buyer_email,
    estado: "Pagado",
  });
}