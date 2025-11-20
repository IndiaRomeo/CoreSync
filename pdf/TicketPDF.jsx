import { Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";

const PRIMARY = "#0e0638";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
    width: 320,
    height: 420,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 0,
    position: "relative",
  },
  header: {
    width: "100%",
    height: 50,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    display: "flex",
  },
  headerText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: 1.5,
    marginTop: 12,
  },
  main: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  number: {
    fontSize: 16,
    color: "#111",
    fontWeight: 700,
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: 6,
  },
  name: {
    fontSize: 15,
    color: "#111",
    textAlign: "center",
    marginBottom: 4,
    fontWeight: 700,
  },
  event: {
    fontSize: 12,
    color: "#111",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 1.4,
    fontWeight: 600,
  },
  qr: {
    width: 110,
    height: 110,
    marginBottom: 4,
    alignSelf: "center",
    border: "1.5 solid #222",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  footer: {
    width: "100%",
    height: 28,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    display: "flex",
  },
  footerText: {
    color: "#fff",
    fontSize: 10,
    letterSpacing: 1.2,
    textAlign: "center",
    marginTop: 8,
  },
});

export default function TicketPDF({ nombre, codigo, qrBase64 }) {
  let ticketNumber = "";
  if (codigo && codigo.split("-").length >= 2) {
    ticketNumber = codigo.split("-")[1];
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
            06 diciembre 2025 — 9:00 PM{"\n"}
            San Sebastián de Mariquita
          </Text>

          <Image src={qrBase64} style={styles.qr} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>#CoreSync | Presenta tu ticket en la entrada</Text>
        </View>
      </Page>
    </Document>
  );
}