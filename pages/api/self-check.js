// pages/api/self-check.js
import { google } from "googleapis";
import fs from "fs";

const CRED_FILE = process.cwd() + "/credenciales.json";
let credentials;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
} else {
  credentials = JSON.parse(fs.readFileSync(CRED_FILE, "utf8"));
}

// Ajusta esto:
const SHEET_ID = "1zpO7v5Pu1TbWqbRmPxpOYb_E5w01irr0ZKe9_MFsxXo";
const SHEET_NAME = "Entradas"; // <== Cambia por el nombre de tu hoja EXACTO

export default async function handler(req, res) {
  const query = (req.query.query || "").trim().toLowerCase();
  if (!query) return res.status(400).json({ ok: false, error: "Falta búsqueda" });

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:H`, // Usa el nombre real de la hoja
    });

    const rows = data.values || [];
    if (rows.length < 2) {
      return res.status(404).json({ ok: false, error: "No hay datos." });
    }
    // Asume la primera fila es encabezado
    const results = rows
      .slice(1)
      .filter(r => {
        const email = (r[3] || "").toLowerCase();
        const telefono = (r[2] || "").replace(/[\s\-]/g, "");
        return email === query || telefono === query.replace(/[\s\-]/g, "");
      })
      .map(r => ({
        codigo: r[0],
        nombre: r[1],
        telefono: r[2],
        email: r[3],
        estado: r[4],
        usado: (r[7] || "").toLowerCase() === "si",
        qr: r[6] || "",
      }));

    if (!results.length) {
      return res.status(404).json({ ok: false, error: "No se encontró ninguna boleta para ese dato." });
    }

    res.json({ ok: true, tickets: results });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Error de servidor: " + e.message });
  }
}