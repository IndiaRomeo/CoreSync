import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  // puede ser GET o POST, pero seguimos con GET para no romper tu front
  const { codigo, sec, qr, validador } = req.query;

  // 1) Normalizar entradas: que al menos venga uno
  if (!codigo && !sec && !qr) {
    return res
      .status(400)
      .json({ ok: false, error: "Falta código, código de seguridad o QR" });
  }

  // 2) Construir filtros dinámicos
  const orFilters = [];

  if (codigo) {
    orFilters.push(`codigo.eq.${codigo}`);
  }

  if (sec) {
    orFilters.push(`security_code.eq.${sec}`);
  }

  if (qr) {
    const qrString = String(qr);
    const parts = qrString.split("|");

    // Asumimos que tu QR trae algo como "algo|CODIGO" (como en tu front)
    const qrCodigo = parts[1] || parts[0];

    // Lo intentamos como código de ticket…
    if (qrCodigo) {
      orFilters.push(`codigo.eq.${qrCodigo}`);
      // …y opcionalmente como ID (si algún día decides poner el uuid en el QR)
      orFilters.push(`id.eq.${qrCodigo}`);
    }
  }

  // Si por alguna razón no se armó ningún filtro:
  if (!orFilters.length) {
    return res
      .status(400)
      .json({ ok: false, error: "No se pudo interpretar el dato enviado" });
  }

  // 3) Buscar en Supabase usando OR
  const { data, error } = await supabaseAdmin
    .from("entradas")
    .select(
      "id, codigo, security_code, buyer_name, buyer_phone, buyer_email, status_pago, qr_used_at, qr_used_by"
    )
    .or(orFilters.join(","))
    .maybeSingle();

  if (error || !data) {
    return res
      .status(404)
      .json({ ok: false, error: "Ticket no encontrado" });
  }

  // 4) Validaciones de negocio

  if (data.status_pago !== "aprobado") {
    return res
      .status(400)
      .json({ ok: false, error: "Ticket no pagado" });
  }

  if (data.qr_used_at) {
    return res.status(400).json({
      ok: false,
      error: "Este ticket ya fue usado.",
    });
  }

  // 5) Marcar como usado
  const { error: updError } = await supabaseAdmin
    .from("entradas")
    .update({
      qr_used_at: new Date().toISOString(),
      qr_used_by: validador || null,
    })
    .eq("id", data.id);

  if (updError) {
    return res
      .status(500)
      .json({ ok: false, error: "Error registrando uso" });
  }

  return res.status(200).json({
    ok: true,
    codigo: data.codigo,
    nombre: data.buyer_name,
    telefono: data.buyer_phone,
    email: data.buyer_email,
    estado: "Pagado",
  });
}