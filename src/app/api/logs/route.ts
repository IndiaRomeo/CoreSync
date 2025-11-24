import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("logs_validacion")
      .select(
        "fecha,codigo,cedula,nombre,email,estado,resultado,validador"
      )
      .order("fecha", { ascending: false })
      .limit(500); // por si hay muchos

    if (error) {
      console.error("❌ Error obteniendo logs:", error);
      return NextResponse.json(
        { error: "Error al obtener logs" },
        { status: 500 }
      );
    }

    // Formateamos fecha a string legible (si quieres)
    const logs = (data ?? []).map((row) => ({
      ...row,
      fecha: row.fecha
        ? new Date(row.fecha).toLocaleString("es-CO", {
            timeZone: "America/Bogota",
          })
        : "",
    }));

    return NextResponse.json({ logs });
  } catch (e) {
    console.error("❌ Error inesperado en /api/logs:", e);
    return NextResponse.json(
      { error: "Error al obtener logs" },
      { status: 500 }
    );
  }
}