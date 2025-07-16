// src/app/api/tickets/route.js
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
const SHEET_ID = "1zpO7v5Pu1TbWqbRmPxpOYb_E5w01irr0ZKe9_MFsxXo";

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "A:H", // ajusta el rango
    });
    const rows = res.data.values || [];
    // La primera fila suele ser encabezados
    const [headers, ...data] = rows;
    const tickets = data.map(row =>
      headers.reduce((obj, h, i) => ({ ...obj, [h]: row[i] }), {})
    );
    return NextResponse.json({ ok: true, tickets });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}