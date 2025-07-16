// /api/validar-ticket/route.js
import { google } from "googleapis";
import { NextResponse } from "next/server";
import fs from "fs";

const CRED_FILE = process.cwd() + "/credenciales.json";
let credentials;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
} else {
  credentials = JSON.parse(fs.readFileSync(CRED_FILE, "utf8"));
}

const SHEET_ID = '1zpO7v5Pu1TbWqbRmPxpOYb_E5w01irr0ZKe9_MFsxXo';

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

    // Leer la hoja
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "A:H",
    });

    const rows = res.data.values || [];
    const idx = rows.findIndex(r => r[0] === codigo);

    if (idx === -1) {
      return NextResponse.json({ ok: false, error: "Ticket no existe." }, { status: 404 });
    }

    // Bandera de "usado" (columna H, r[7])
    const usado = (rows[idx][7] || "").toUpperCase() === "SI";

    if (usado) {
      // Ya fue validado antes
      return NextResponse.json({
        ok: false,
        error: "Este ticket ya fue usado.",
        codigo,
      }, { status: 400 });
    }

    // Marcar como "SI" (usado) en la hoja
    // idx + 1 porque Sheets es 1-based y primera fila suele ser encabezado
    const rowNumber = idx + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `H${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["SI"]],
      },
    });

    // Devolver los datos
    return NextResponse.json({
      ok: true,
      codigo,
      nombre: rows[idx][1],
      telefono: rows[idx][2],
      email: rows[idx][3],
      estado: rows[idx][4],
      usado: true,
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}