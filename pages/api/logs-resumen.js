import { google } from "googleapis";
import fs from "fs";

const CRED_FILE = process.cwd() + "/credenciales.json";
let credentials;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
} else {
  credentials = JSON.parse(fs.readFileSync(CRED_FILE, "utf8"));
}

const SHEET_ID = "1zpO7v5Pu1TbWqbRmPxpOYb_E5w01irr0ZKe9_MFsxXo"; // tu hoja
const SHEET_NAME = "Logs"; // asegúrate que este sea el nombre exacto

export default async function handler(req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:F`,
    });

    const rows = data.values || [];

    const resumen = {};

    for (const row of rows) {
      const validador = row[5]?.trim(); // columna F
      if (validador) {
        resumen[validador] = (resumen[validador] || 0) + 1;
      }
    }

    const resultado = Object.entries(resumen).map(([validador, cantidad]) => ({
      validador,
      cantidad,
    }));

    res.status(200).json({ resumen: resultado });
  } catch (error) {
    console.error("Error al obtener resumen:", error);
    res.status(500).json({ error: "Error al generar resumen" });
  }
}