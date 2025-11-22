import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

type TicketPDFProps = {
  buyerName: string;
  eventName: string;
  eventDateLabel: string;     // Ej: "06 diciembre 2025 — 9:00 PM"
  eventLocation: string;      // Ej: "San Sebastián de Mariquita"
  codigo: string;             // Ej: "CS-390388"
  priceLabel: string;         // Ej: "COP $22.000"
  qrBase64: string;           // solo el base64, sin el prefijo
  logoUrl?: string;           // opcional: url o ruta estática de tu logo
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 32,
    backgroundColor: "#F4F4F6",
    fontFamily: "Helvetica",
  },
  container: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#222222",
  },
  header: {
    backgroundColor: "#04030A", // oscuro techno
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
    borderRadius: 30,
  },
  eventTitle: {
    fontSize: 16,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  body: {
    paddingVertical: 24,
    paddingHorizontal: 28,
  },
  ticketLabel: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#777777",
    marginBottom: 4,
  },
  ticketCode: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12,
    color: "#111111",
  },
  buyerLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#999999",
    marginBottom: 2,
  },
  buyerName: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 12,
    color: "#111111",
  },
  infoRow: {
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#999999",
  },
  infoText: {
    fontSize: 11,
    color: "#222222",
  },
  priceRow: {
    marginTop: 10,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#999999",
  },
  priceText: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111111",
  },
  qrContainer: {
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  qrBox: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
  },
  qrImage: {
    width: 160,
    height: 160,
  },
  footer: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: "#EEEEEE",
    backgroundColor: "#05030F",
  },
  footerTextMain: {
    fontSize: 9,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  footerTextSub: {
    fontSize: 7.5,
    color: "#AAAAAA",
    textAlign: "center",
    lineHeight: 1.3,
  },
  hashtag: {
    fontWeight: 600,
  },
});

const TicketPDF: React.FC<TicketPDFProps> = ({
  buyerName,
  eventName,
  eventDateLabel,
  eventLocation,
  codigo,
  priceLabel,
  qrBase64,
  logoUrl,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          {logoUrl ? (
            <Image style={styles.logo} src={logoUrl} />
          ) : null}
          <Text style={styles.eventTitle}>{eventName}</Text>
        </View>

        {/* BODY */}
        <View style={styles.body}>
          <Text style={styles.ticketLabel}>Ticket</Text>
          <Text style={styles.ticketCode}>#{codigo}</Text>

          <Text style={styles.buyerLabel}>Titular</Text>
          <Text style={styles.buyerName}>{buyerName}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha y hora</Text>
            <Text style={styles.infoText}>{eventDateLabel}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lugar</Text>
            <Text style={styles.infoText}>{eventLocation}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Precio</Text>
            <Text style={styles.priceText}>{priceLabel}</Text>
          </View>

          <View style={styles.qrContainer}>
            <View style={styles.qrBox}>
              <Image
                style={styles.qrImage}
                src={`data:image/png;base64,${qrBase64}`}
              />
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerTextMain}>
            <Text style={styles.hashtag}>#CoreSync</Text> | Presenta este ticket
            en la entrada.
          </Text>
          <Text style={styles.footerTextSub}>
            Entrada personal e intransferible. Prohibida su reventa. El código
            QR es único y será validado una sola vez en el punto de acceso. La
            organización se reserva el derecho de admisión.
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default TicketPDF;