// /api/validar-ticket/route.js
import { google } from "googleapis";
import { NextResponse } from "next/server";
import fs from "fs";

const CRED_FILE = process.cwd() + "/credenciales.json";
const credentials = JSON.parse(fs.readFileSync(CRED_FILE, "utf8"));
const SHEET_ID = '...';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const codigo = searchParams.get("codigo");

  if (!codigo) {
    return NextResponse.json({ ok: false, error: "Falta código" }, { status: 400 });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // Lee toda la hoja (puedes optimizar para produ, esto es fácil de usar)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "A:G",
    });

    const rows = res.data.values || [];
    const idx = rows.findIndex(r => r[0] === codigo);

    if (idx === -1) {
      return NextResponse.json({ ok: false, error: "Ticket no existe" }, { status: 404 });
    }

    // Si tienes un campo "usado", puedes comprobarlo, ej: columna H = r[7]
    // const usado = rows[idx][7] === "SI";

    return NextResponse.json({
      ok: true,
      codigo,
      nombre: rows[idx][1],
      telefono: rows[idx][2],
      email: rows[idx][3],
      estado: rows[idx][4],
      // usado,
      // ...más info que guardes
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}