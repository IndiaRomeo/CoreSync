import { NextResponse } from "next/server";
import { pdf, Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import path from "path";

// IMPORTANTE: Quita stream-buffers, no se necesita con react-pdf
// Font.register necesita ruta absoluta correcta
Font.register({ family: "Orbitron", src: path.join(process.cwd(), "public/fonts/Orbitron.ttf") });
Font.register({ family: "Montserrat", src: path.join(process.cwd(), "public/fonts/Montserrat.ttf") });

const PRIMARY = "#0e0638";

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
    fontFamily: 'Orbitron',
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
    fontFamily: 'Orbitron',
    fontSize: 16,
    color: '#111',
    fontWeight: 700,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 6,
  },
  name: {
    fontFamily: 'Montserrat',
    fontSize: 15,
    color: '#111',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: 700,
  },
  event: {
    fontFamily: 'Montserrat',
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
    fontFamily: 'Orbitron',
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
        {/* ... igual que tienes */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Core Sync Collective</Text>
        </View>
        <View style={styles.main}>
          <Text style={styles.number}>TICKET #{ticketNumber}</Text>
          <Text style={styles.name}>{nombre}</Text>
          <Text style={styles.event}>
            16 de agosto, 9:00 PM{"\n"}hasta 17 de agosto, 5:00 AM
          </Text>
          <View style={{ height: 40 }} />
          <Image src={qrBase64} style={styles.qr} />
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>#CoreSync | Presenta tu ticket en la entrada</Text>
        </View>
      </Page>
    </Document>
  );
}

// --- Este es el endpoint que devuelve el PDF como Buffer correctamente ---
export async function POST(req) {
  try {
    const data = await req.json();
    const { nombre, codigo, qrBase64 } = data;

    let ticketNumber = '';
    if (codigo && codigo.split('-').length >= 3) {
      ticketNumber = codigo.split('-')[2];
    }

    // 1. Crea el documento
    const pdfDoc = pdf(
      <TicketPDF nombre={nombre} codigo={codigo} qrBase64={qrBase64} />
    );

    // 2. Obtén el Buffer binario
    const pdfBuffer = await pdfDoc.toBuffer();

    // 3. Devuelve el buffer como PDF con los headers CORRECTOS
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ticket#${ticketNumber}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
        // NO pongas Content-Encoding, ni nada más
      },
    });
  } catch (e) {
    // Puedes devolver un PDF de error o solo un JSON
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}