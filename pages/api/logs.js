// pages/api/logs.js
import { google } from "googleapis";
import fs from "fs";

const CRED_FILE = process.cwd() + "/credenciales.json";
let credentials;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
} else {
  credentials = JSON.parse(fs.readFileSync(CRED_FILE, "utf8"));
}

const SHEET_ID = "1zpO7v5Pu1TbWqbRmPxpOYb_E5w01irr0ZKe9_MFsxXo";
const SHEET_NAME = "Logs"; // asegúrate que sea el nombre exacto de la pestaña

export default async function handler(req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:H`, // A: Fecha, B: Código, C: Cédula, D: Nombre, E: Email, F: Estado, G: Resultado, H: Validador
    });

    const rows = data.values || [];

    const logs = rows.map((row) => ({
        fecha: row[0] || "",
        codigo: row[1] || "",
        cedula: row[2] || "",
        nombre: row[3] || "",
        email: row[4] || "",
        estado: row[5] || "",
        resultado: row[6] || "",
        validador: row[7] || "",
    }));

    res.status(200).json({ logs });
  } catch (error) {
    console.error("Error al obtener logs:", error);
    res.status(500).json({ error: "Error al obtener logs" });
  }
}