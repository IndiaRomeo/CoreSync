// pages/api/boleta-pdf.js
import { pdf, Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';

// ==== AGREGADO: GOOGLE SHEETS ====
import { google } from "googleapis";
import fs from "fs";

const CRED_FILE = process.cwd() + "/credenciales.json";
let credentials;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
} else {
  credentials = JSON.parse(fs.readFileSync(CRED_FILE, "utf8"));
}

const SHEET_ID = '1zpO7v5Pu1TbWqbRmPxpOYb_E5w01irr0ZKe9_MFsxXo';
// ================================

const PRIMARY = '#0e0638';
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    width: 320,
    height: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 0,
    position: 'relative',
  },
  header: {
    width: '100%',
    height: 50,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    display: 'flex',
  },
  headerText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: 1.5,
    marginTop: 12,
  },
  main: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  number: {
    fontSize: 16,
    color: '#111',
    fontWeight: 700,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 15,
    color: '#111',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: 700,
  },
  event: {
    fontSize: 12,
    color: '#111',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 1.4,
    fontWeight: 600,
  },
  qr: {
    width: 110,
    height: 110,
    marginBottom: 4,
    alignSelf: 'center',
    border: `1.5 solid #222`,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  footer: {
    width: '100%',
    height: 28,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    display: 'flex',
  },
  footerText: {
    color: '#fff',
    fontSize: 10,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 8,
  },
});

// Componente del PDF
function TicketPDF({ nombre, codigo, qrBase64 }) {
  let ticketNumber = '';
  if (codigo && codigo.split('-').length >= 3) {
    ticketNumber = codigo.split('-')[2];
  }
  return (
    <Document>
      <Page size={{ width: 318, height: 420 }} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Core Sync Collective</Text>
        </View>
        <View style={styles.main}>
          <Text style={styles.number}>TICKET #{ticketNumber}</Text>
          <Text style={styles.name}>{nombre}</Text>
          <Text style={styles.event}>
            16 de agosto, 9:00 PM{'\n'}
            hasta 17 de agosto, 5:00 AM
          </Text>
          <View style={{ height: 40 }} />
          <PdfImage src={qrBase64} style={styles.qr} />
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>#CoreSync | Presenta tu ticket en la entrada</Text>
        </View>
      </Page>
    </Document>
  );
}

// Helper: genera PDF buffer
async function generarPDF({ nombre, codigo, qrBase64 }) {
  const pdfDoc = pdf(
    <TicketPDF nombre={nombre} codigo={codigo} qrBase64={qrBase64} />
  );
  return await pdfDoc.toBuffer();
}

// ======================
// API Route handler
// ======================
export default async function handler(req, res) {
  // POST: Genera PDF con datos enviados
  if (req.method === 'POST') {
    const { nombre, codigo, qrBase64 } = req.body;
    let ticketNumber = '';
    if (codigo && codigo.split('-').length >= 3) {
      ticketNumber = codigo.split('-')[2];
    }
    const pdfBuffer = await generarPDF({ nombre, codigo, qrBase64 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket#${ticketNumber}.pdf"`);
    return res.status(200).send(pdfBuffer);
  }

  // GET: Busca en Google Sheets por código y genera PDF
  if (req.method === 'GET') {
    const { codigo } = req.query;
    if (!codigo) return res.status(400).send("Falta código");

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const resSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "A:I",
    });
    const rows = resSheet.data.values || [];
    const idx = rows.findIndex(r => r[0] === codigo);
    if (idx === -1) return res.status(404).send("No existe ese ticket");

    const nombre = rows[idx][1];
    const qrBase64 = rows[idx][6] || rows[idx][7]; // AJUSTA si tu QR está en otra columna
    if (!qrBase64) return res.status(404).send("QR no encontrado");

    let ticketNumber = '';
    if (codigo && codigo.split('-').length >= 3) {
      ticketNumber = codigo.split('-')[2];
    }
    const pdfBuffer = await generarPDF({ nombre, codigo, qrBase64 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket#${ticketNumber}.pdf"`);
    return res.status(200).send(pdfBuffer);
  }

  // Otro método (no permitido)
  res.status(405).end();
}