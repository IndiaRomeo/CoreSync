// pages/api/backup.js
import { google } from "googleapis";
import fs from "fs";

const CRED_FILE = process.cwd() + "/credenciales.json";
const credentials = JSON.parse(fs.readFileSync(CRED_FILE, "utf8"));
const SHEET_ID = "1zpO7v5Pu1TbWqbRmPxpOYb_E5w01irr0ZKe9_MFsxXo";
const SHEET_NAME = "Entradas"; // Cambia si tu hoja tiene otro nombre

export default async function handler(req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:H`,
    });
    const rows = result.data.values || [];
    if (!rows.length) throw new Error("No data");

    const csv = rows.map(r =>
      r.map(v => `"${(v ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const date = new Date().toISOString().slice(0, 10);
    const filename = `backup_${SHEET_NAME}_${date}.csv`;

    // Descarga directa como archivo
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (e) {
    console.error("Error en backup:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}