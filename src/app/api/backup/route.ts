import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// 👇 ajusta esto si quieres cambiar nombres/columnas
const TABLES = {
  entradas: {
    table: "entradas",
    columns: [
      "id",
      "codigo",
      "buyer_name",
      "buyer_email",
      "buyer_phone",
      "status_pago",
      "importe",
      "divisa",
      "event_name",
      "event_date",
      "event_location",
      "qr_used_at",
      "qr_used_by",
      "created_at",
    ],
  },
  logs: {
    table: "logs_validacion", // 👈 nombre correcto de tu tabla
    columns: [
      "id",
      "fecha",
      "codigo",
      "cedula",
      "nombre",
      "email",
      "estado",
      "resultado",
      "validador",
      "created_at",
    ],
  },
} as const;

type TableKey = keyof typeof TABLES;
type Row = Record<string, unknown>;

// pequeña utilidad para convertir a CSV
function rowsToCsv(rows: Row[], columns: readonly string[]): string {
  const header = columns.join(",");

  const body = rows.map((row) =>
    columns
      .map((col) => {
        const raw = row[col];
        const value =
          typeof raw === "string"
            ? raw
            : raw == null
            ? ""
            : JSON.stringify(raw);

        // escapamos comillas y saltos de línea
        return `"${value
          .replace(/"/g, '""')
          .replace(/\r?\n/g, " ")}"`;
      })
      .join(",")
  );

  return [header, ...body].join("\r\n");
}

export async function GET(req: NextRequest) {
  try {
    const adminCookie = req.cookies.get("admin_auth");
    if (!adminCookie || adminCookie.value !== "1") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const url = new URL(req.url);
    const tablaParam =
      (url.searchParams.get("tabla") as TableKey | null) ?? "entradas"; // ?tabla=entradas | logs

    const config = TABLES[tablaParam];

    if (!config) {
      return new NextResponse("Tabla no permitida", { status: 400 });
    }

    // 🔒 OPCIONAL: validación de cookie de admin
    // const cookie = req.cookies.get("NOMBRE_DE_TU_COOKIE");
    // if (!cookie || cookie.value !== "OK") {
    //   return new NextResponse("No autorizado", { status: 401 });
    // }

    const { data, error } = await supabaseAdmin
      .from(config.table)
      .select(config.columns.join(","))
      .order(
        config.columns.includes("created_at") ? "created_at" : "fecha",
        {
          ascending: true,
        }
      );

    if (error) {
      console.error("❌ Error obteniendo datos para backup:", error);
      return new NextResponse("Error al generar backup", { status: 500 });
    }

    // 👇 aquí el cast "seguro" vía unknown
    const rows = (data ?? []) as unknown as Row[];
    const csv = rowsToCsv(rows, config.columns);

    const date = new Date().toISOString().slice(0, 10);
    const filename = `backup_${config.table}_${date}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("❌ Error inesperado en /api/backup:", e);
    return new NextResponse("Error al generar backup", { status: 500 });
  }
}