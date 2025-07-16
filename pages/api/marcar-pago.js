import { google } from "googleapis";
import fs from "fs";

const SHEET_ID = "1zpO7v5Pu1TbWqbRmPxpOYb_E5w01irr0ZKe9_MFsxXo";
const CRED_FILE = process.cwd() + "/credenciales.json";
let credentials;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
} else {
  credentials = JSON.parse(fs.readFileSync(CRED_FILE, "utf8"));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { codigo } = req.body;
  if (!codigo) return res.status(400).json({ ok: false, error: "Falta código" });

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const sheet = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "A:H",
    });
    const rows = sheet.data.values || [];
    const idx = rows.findIndex(r => r[0] === codigo);
    if (idx === -1) return res.status(404).json({ ok: false, error: "No existe el ticket" });

    const rowNumber = idx + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `E${rowNumber}`, // Columna E (Estado)
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["Pagado"]] },
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}