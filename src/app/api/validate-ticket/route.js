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

// Agrega un log a la hoja Logs
async function addLog(sheets, { codigo, nombre, email, estado, resultado, validador = "" }) {
  const now = new Date();
  // Ajusta hora local si tu servidor está en UTC (Colombia: UTC-5)
  const fecha = now.toLocaleString("es-CO", { timeZone: "America/Bogota" });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Logs!A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[fecha, codigo, nombre, email, estado, resultado, validador]],
    },
  });
}

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
      range: "A:I",
    });

    const rows = res.data.values || [];
    const idx = rows.findIndex(r => r[0] === codigo);

    if (idx === -1) {
      // No existe
      // Puedes loguear intentos no válidos si quieres, pero usualmente no.
      return NextResponse.json({ ok: false, error: "Ticket no existe." }, { status: 404 });
    }

    // Bandera de "usado" (columna H, r[7])
    const usado = (rows[idx][7] || "").toUpperCase() === "SI";
    const estado = (rows[idx][4] || "").toLowerCase(); // Columna E es estado
    const baseLog = {
      codigo,
      nombre: rows[idx][1],
      email: rows[idx][3],
      estado: rows[idx][4],
      validador: "", // Puedes poner aquí nombre de validador si tienes login/admin
    };

    if (usado) {
      // Ya fue validado antes
      await addLog(sheets, { ...baseLog, resultado: "YA USADO" });
      return NextResponse.json({
        ok: false,
        error: "Este ticket ya fue usado.",
        codigo,
      }, { status: 400 });
    }

    // NO permitir validar tickets reservados
    if (estado !== "pagado") {
      await addLog(sheets, { ...baseLog, resultado: "RESERVADO" });
      return NextResponse.json({
        ok: false,
        error: "No puedes validar una boleta reservada. Debe estar PAGADA.",
        codigo,
      }, { status: 400 });
    }

    // Si el ticket fue válido:
    // Marcar como "SI" (usado) en la hoja
    const rowNumber = idx + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `H${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["SI"]],
      },
    });

    await addLog(sheets, { ...baseLog, resultado: "VALIDADO" });

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