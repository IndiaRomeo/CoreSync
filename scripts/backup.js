// scripts/backup.js
import { google } from "googleapis";
import fs from "fs";
import cron from "node-cron";

const CRED_FILE = process.cwd() + "/credenciales.json";
const credentials = JSON.parse(fs.readFileSync(CRED_FILE, "utf8"));
const SHEET_ID = "1zpO7v5Pu1TbWqbRmPxpOYb_E5w01irr0ZKe9_MFsxXo";
const SHEET_NAME = "Entradas"; // Cambia por el nombre real de tu hoja

async function backupSheetToCSV() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:H`,
    });
    const rows = res.data.values || [];
    if (!rows.length) throw new Error("No data");

    const csv = rows.map(r =>
      r.map(v => `"${(v ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const date = new Date().toISOString().slice(0, 10);
    const filename = `backup_${SHEET_NAME}_${date}.csv`;
    fs.writeFileSync(filename, csv);

    console.log(`Backup guardado localmente: ${filename}`);
  } catch (e) {
    console.error("Error en backup:", e);
  }
}

// Programa el backup automático: cada día a las 2:00am
cron.schedule('0 2 * * *', backupSheetToCSV); // Hora del servidor

// Permite ejecutar manualmente si corres `node scripts/backup.js`
if (require.main === module) {
  backupSheetToCSV();
}

export default backupSheetToCSV;