// pages/api/self-check.js
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  const { query } = req.query;
  if (!query) {
    return res
      .status(400)
      .json({ error: "Falta parámetro de búsqueda", tickets: [] });
  }

  const raw = String(query).trim();
  if (!raw) {
    return res
      .status(400)
      .json({ error: "Falta parámetro de búsqueda", tickets: [] });
  }

  const orFilters = [];

  // Si parece correo → buscar por buyer_email
  if (raw.includes("@")) {
    orFilters.push(`buyer_email.ilike.%${raw.toLowerCase()}%`);
  } else {
    // Si no es correo, probamos teléfono (solo dígitos) y código
    const digits = raw.replace(/\D/g, "");
    if (digits) {
      orFilters.push(`buyer_phone.ilike.%${digits}%`);
    }

    // También permitir poner el código directamente
    orFilters.push(`codigo.ilike.%${raw}%`);
  }

  if (!orFilters.length) {
    return res.status(200).json({ tickets: [] });
  }

  const { data, error } = await supabaseAdmin
    .from("entradas")
    .select(
      "codigo, buyer_name, buyer_phone, buyer_email, status_pago, qr_used_at, created_at"
    )
    .or(orFilters.join(","))
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Error en self-check:", error);
    return res.status(500).json({ error: "Error consultando tickets", tickets: [] });
  }

  const tickets = (data || []).map((t) => ({
    codigo: t.codigo || "",
    nombre: t.buyer_name || "",
    telefono: t.buyer_phone || "",
    email: t.buyer_email || "",
    estado: t.status_pago || "",
    usado: !!t.qr_used_at,
    usadoEn: t.qr_used_at,
  }));

  return res.status(200).json({ tickets });
}