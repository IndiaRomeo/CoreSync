import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("entradas")
      .select("*")
      .limit(5);

    if (error) throw error;

    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error("Error Supabase:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}