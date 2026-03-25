import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function registrarLog({
  codigo,
  nombre,
  email,
  estado,
  resultado,
  validador,
}) {
  try {
    await supabaseAdmin.from("logs_validacion").insert({
      fecha: new Date().toISOString(),
      codigo,
      nombre,
      email,
      estado,
      resultado,
      validador: validador || "DESCONOCIDO",
    });
  } catch (e) {
    console.error("Error registrando log de validación:", e);
  }
}

export default async function handler(req, res) {
  const { codigo, sec, qr, validador } = req.query;

  if (!codigo && !sec && !qr) {
    return res.status(400).json({
      ok: false,
      error: "Falta código, código de seguridad o QR",
    });
  }

  const orFilters = [];
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // A) Código manual
  if (codigo) {
    const cod = String(codigo).trim();
    if (cod) {
      orFilters.push(`codigo.eq.${cod}`);
    }
  }

  // B) Código de seguridad manual
  if (sec) {
    const s = String(sec).trim();
    if (s) {
      orFilters.push(`security_code.eq.${s}`);
    }
  }

  // C) QR escaneado
  if (qr) {
    const qrString = String(qr).trim();

    // 1. Intentar leer como URL
    try {
      const url = new URL(qrString);
      const qpCodigo =
        url.searchParams.get("codigo") ||
        url.searchParams.get("ticket") ||
        url.searchParams.get("code");

      const qpId =
        url.searchParams.get("id") ||
        url.searchParams.get("entradaId") ||
        url.searchParams.get("ticketId");

      if (qpCodigo) {
        orFilters.push(`codigo.eq.${qpCodigo.trim()}`);
      }

      if (qpId && uuidRegex.test(qpId.trim())) {
        orFilters.push(`id.eq.${qpId.trim()}`);
      }
    } catch {
      // No era URL, seguimos
    }

    // 2. Formato con pipes: CoreSync|CS-937267|Nombre|Tel|Email
    const parts = qrString
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);

    for (const p of parts) {
      if (/^CS-\d{4,12}$/i.test(p)) {
        orFilters.push(`codigo.eq.${p}`);
      }

      if (uuidRegex.test(p)) {
        orFilters.push(`id.eq.${p}`);
      }
    }

    // 3. Fallback: buscar patrón tipo CS-######
    const match = qrString.match(/CS-\d{4,12}/i);
    if (match) {
      orFilters.push(`codigo.eq.${match[0]}`);
    }
  }

  // Eliminar duplicados
  const uniqueFilters = [...new Set(orFilters)];

  if (!uniqueFilters.length) {
    return res.status(400).json({
      ok: false,
      error: "No se pudo interpretar el dato enviado",
    });
  }

  const { data, error } = await supabaseAdmin
    .from("entradas")
    .select(
      "id, codigo, security_code, buyer_name, buyer_phone, buyer_email, status_pago, qr_used_at, qr_used_by"
    )
    .or(uniqueFilters.join(","))
    .maybeSingle();

  if (error) {
    console.error("Error Supabase validate-ticket:", error);
    return res.status(500).json({
      ok: false,
      error: "Error consultando el ticket",
    });
  }

  if (!data) {
    return res.status(404).json({
      ok: false,
      error: "Ticket no encontrado",
    });
  }

  // Ticket no pagado
  if (String(data.status_pago).toLowerCase() !== "aprobado") {
    await registrarLog({
      codigo: data.codigo,
      nombre: data.buyer_name,
      email: data.buyer_email,
      estado: data.status_pago,
      resultado: "NO_PAGADO",
      validador,
    });

    return res.status(400).json({
      ok: false,
      error: "Ticket no pagado",
    });
  }

  // Ticket ya usado
  if (data.qr_used_at) {
    await registrarLog({
      codigo: data.codigo,
      nombre: data.buyer_name,
      email: data.buyer_email,
      estado: data.status_pago,
      resultado: "YA_USADO",
      validador,
    });

    return res.status(400).json({
      ok: false,
      error: "Este ticket ya fue usado.",
    });
  }

  // Validación OK
  const { error: updError } = await supabaseAdmin
    .from("entradas")
    .update({
      qr_used_at: new Date().toISOString(),
      qr_used_by: validador || null,
    })
    .eq("id", data.id);

  if (updError) {
    console.error("Error actualizando uso de ticket:", updError);
    return res.status(500).json({
      ok: false,
      error: "Error registrando uso",
    });
  }

  await registrarLog({
    codigo: data.codigo,
    nombre: data.buyer_name,
    email: data.buyer_email,
    estado: data.status_pago,
    resultado: "VALIDADO",
    validador,
  });

  return res.status(200).json({
    ok: true,
    codigo: data.codigo,
    nombre: data.buyer_name,
    telefono: data.buyer_phone,
    email: data.buyer_email,
    estado: "Pagado",
  });
}