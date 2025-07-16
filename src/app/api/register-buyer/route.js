import { google } from "googleapis";
import { NextResponse } from "next/server";
import fs from "fs";
import QRCode from "qrcode";
import path from "path";
import sharp from "sharp";

const CRED_FILE = process.cwd() + "/credenciales.json";
const credentials = JSON.parse(fs.readFileSync(CRED_FILE, "utf8"));
const SHEET_ID = '1zpO7v5Pu1TbWqbRmPxpOYb_E5w01irr0ZKe9_MFsxXo';

export async function POST(req) {
  try {
    const data = await req.json();

    // Generar código ÚNICO
    function generarCodigo() {
      const now = new Date();
      const fecha = now.toISOString().slice(0, 10).replace(/-/g, "");
      const hora = now.toTimeString().slice(0, 8).replace(/:/g, "");
      const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
      return `CS-${fecha}-${hora}-${rand}`;
    }
    const codigo = generarCodigo();

    // --- Generar el QR como PNG buffer ---
    const qrContent = `CoreSync|${codigo}|${data.nombre}|${data.telefono}|${data.email}`;
    const qrBuffer = await QRCode.toBuffer(qrContent, {
      color: { dark: "#1d0e6bff", light: "#fff" },
      margin: 2,
      width: 320
    });

    // --- Cargar el logo PNG y ajustar su tamaño si es necesario ---
    const logoPath = path.join(process.cwd(), 'public/logo-qr.png');
    let logoBuffer = fs.readFileSync(logoPath);

    // Opcional: asegúrate que el logo sea de 80x80 px
    logoBuffer = await sharp(logoBuffer).resize(80, 80).png().toBuffer();

    // --- Mezclar el logo al centro del QR ---
    const qrWithLogoBuffer = await sharp(qrBuffer)
      .composite([
        {
          input: logoBuffer,
          top: Math.round(320 / 2 - 40),   // 40 es la mitad de 80
          left: Math.round(320 / 2 - 40)
        }
      ])
      .png()
      .toBuffer();

    const qrWithLogoBase64 = 'data:image/png;base64,' + qrWithLogoBuffer.toString('base64');

    // --- Autenticación Google ---
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          codigo,
          data.nombre || "",
          data.telefono || "",
          data.email || "",
          data.estado || "",
          qrWithLogoBase64, // QR generado (con logo en el centro)
          data.observaciones || ""
        ]]
      }
    });

    return NextResponse.json({
      ok: true,
      codigo,
      nombre: data.nombre,
      telefono: data.telefono,
      email: data.email,
      estado: data.estado,
      qrBase64: qrWithLogoBase64, // este QR es el que debes usar en el PDF
      observaciones: data.observaciones || ""
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}