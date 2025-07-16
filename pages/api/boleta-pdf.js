// pages/api/boleta-pdf.js
import { pdf, Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Función para obtener la ruta segura de la fuente
function getFontBuffer(fontName) {
  // Busca la fuente en /public/fonts o /fonts, según cómo tengas el proyecto
  const localPath = path.join(process.cwd(), "public/fonts", fontName);
  const altPath = path.join(process.cwd(), "fonts", fontName);
  if (fs.existsSync(localPath)) return fs.readFileSync(localPath);
  if (fs.existsSync(altPath)) return fs.readFileSync(altPath);
  throw new Error(`Fuente no encontrada: ${fontName}`);
}

// Intenta registrar Orbitron y Montserrat con base64
let orbitronBuffer, montserratBuffer;
try {
  orbitronBuffer = getFontBuffer("Orbitron.ttf");
  montserratBuffer = getFontBuffer("Montserrat.ttf");
  Font.register({
    family: 'Orbitron',
    src: `data:font/ttf;base64,${orbitronBuffer.toString('base64')}`
  });
  Font.register({
    family: 'Montserrat',
    src: `data:font/ttf;base64,${montserratBuffer.toString('base64')}`
  });
} catch {
  // Si no encuentras la fuente, usa Helvetica para no romper todo
  console.warn("No se encontraron fuentes custom. Se usará Helvetica.");
}

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
    fontFamily: 'Orbitron',  // USA LA FUENTE REGISTRADA
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
    fontFamily: 'Orbitron',  // USA LA FUENTE REGISTRADA
    fontSize: 16,
    color: '#111',
    fontWeight: 700,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 6,
  },
  name: {
    fontFamily: 'Montserrat', // USA LA FUENTE REGISTRADA
    fontSize: 15,
    color: '#111',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: 700,
  },
  event: {
    fontFamily: 'Montserrat', // USA LA FUENTE REGISTRADA
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
    fontFamily: 'Orbitron',  // USA LA FUENTE REGISTRADA
    color: '#fff',
    fontSize: 10,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 8,
  },
});

function TicketPDF({ nombre, codigo, qrBase64 }) {
  let ticketNumber = '';
  if (codigo && codigo.split('-').length >= 3) {
    ticketNumber = codigo.split('-')[2];
  }
  return (
    <Document>
      <Page size={{ width: 318, height: 420 }} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Core Sync Collective</Text>
        </View>
        {/* Main content */}
        <View style={styles.main}>
          <Text style={styles.number}>TICKET #{ticketNumber}</Text>
          <Text style={styles.name}>{nombre}</Text>
          <Text style={styles.event}>
            16 de agosto, 9:00 PM{'\n'}
            hasta 17 de agosto, 5:00 AM
          </Text>
          <View style={{ height: 40 }} />
          <Image src={qrBase64} style={styles.qr} />
        </View>
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>#CoreSync | Presenta tu ticket en la entrada</Text>
        </View>
      </Page>
    </Document>
  );
}

// Next.js API route
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { nombre, codigo, qrBase64 } = req.body;

  let ticketNumber = '';
  if (codigo && codigo.split('-').length >= 3) {
    ticketNumber = codigo.split('-')[2];
  }

  const pdfDoc = pdf(
    <TicketPDF nombre={nombre} codigo={codigo} qrBase64={qrBase64} />
  );
  const pdfBuffer = await pdfDoc.toBuffer();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ticket#${ticketNumber}.pdf"`);
  res.status(200).send(pdfBuffer);
}
