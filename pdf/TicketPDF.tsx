// pdf/TicketPDF.tsx
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
  eventDateLabel: string;
  eventLocation: string;
  codigo: string;
  priceLabel: string;
  qrBase64: string;
  logoUrl?: string;
  securityCode: string;
};

const styles = StyleSheet.create({
  // Página más pequeña (tipo flyer) + poco padding
  page: {
    padding: 16,
    backgroundColor: "#050509",
    fontFamily: "Helvetica",
  },

  // El ticket ahora ocupa casi todo el ancho de la página A5
  container: {
    flexDirection: "row",
    borderRadius: 14,
    backgroundColor: "#181920",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#262737",
    position: "relative",
    width: "100%",
    minHeight: 0,
  },

  // ---------- WATERMARK ----------
  watermarkContainer: {
    position: "absolute",
    top: "10%",
    left: 0,
    right: 0,
    alignItems: "center",
    opacity: 0.06,
  },
  watermarkImage: {
    width: 320,
    height: 320,
    transform: "rotate(-25deg)",
  },

  // ---------- LADO PRINCIPAL ----------
  ticketLeft: {
    flex: 3,
    backgroundColor: "#20212A",
  },
  header: {
    backgroundColor: "#05040C",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#292A3A",
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  headerTextBlock: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  eventSubtitle: {
    fontSize: 9,
    color: "#A0A1B8",
    marginTop: 2,
  },

  // textura “industrial” con franjas
  body: {
    paddingVertical: 18,
    paddingHorizontal: 22,
  },
  textureStrip: {
    height: 6,
    marginBottom: 12,
    flexDirection: "row",
  },
  textureBlock: {
    flex: 1,
    backgroundColor: "#262736",
  },
  textureBlockAlt: {
    flex: 1,
    backgroundColor: "#1D1E28",
  },

  ticketLabel: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#8587A0",
    marginBottom: 4,
  },
  ticketCode: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
    color: "#F5F5FA",
  },
  buyerLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#8587A0",
    marginBottom: 2,
  },
  buyerName: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 10,
    color: "#FFFFFF",
  },
  infoRow: {
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#8587A0",
  },
  infoText: {
    fontSize: 11,
    color: "#E4E4F2",
  },
  priceRow: {
    marginTop: 8,
    marginBottom: 14,
  },
  priceLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#8587A0",
  },
  priceText: {
    fontSize: 13,
    fontWeight: 600,
    color: "#FFFFFF",
  },

  qrAndSecurityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  qrBox: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3A3B4D",
    backgroundColor: "#15161E",
  },
  qrImage: {
    width: 180,     // QR más grande tipo MedellinStyle
    height: 180,
  },

  // ---------- HOLOGRAMA + CÓDIGO SEGURIDAD ----------
  securityBlock: {
    flex: 1,
  },
  securityLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#8587A0",
    marginBottom: 4,
  },
  securityCode: {
    fontSize: 12,
    fontWeight: 600,
    color: "#FFFFFF",
    letterSpacing: 2,
    marginBottom: 10,
  },

  hologramOuter: {
    width: 92,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#38bdf8",
    backgroundColor: "#020617",
    overflow: "hidden",
  },
  hologramInner: {
    flex: 1,
    flexDirection: "row",
  },
  hologramStrip1: { flex: 1, backgroundColor: "#020617" },
  hologramStrip2: { flex: 1, backgroundColor: "#0f172a" },
  hologramStrip3: { flex: 1, backgroundColor: "#1e293b" },

  hologramGloss: {
    position: "absolute",
    left: -10,
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: "#38bdf8",
    opacity: 0.18,
  },

  hologramOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  hologramText: {
    fontSize: 7,
    color: "#e5e7eb",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    opacity: 0.85,
  },

  footer: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: "#2A2B3A",
    backgroundColor: "#111119",
  },
  footerTextMain: {
    fontSize: 9,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 3,
  },
  footerTextSub: {
    fontSize: 7.5,
    color: "#A0A1B8",
    textAlign: "center",
    lineHeight: 1.3,
  },
  hashtag: {
    fontWeight: 600,
  },

  // ---------- TALONARIO LATERAL ----------
  ticketRight: {
    flex: 1,
    backgroundColor: "#0C0C13",
    borderLeftWidth: 1,
    borderColor: "#2F3040",
    paddingVertical: 16,
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  perforation: {
    borderLeftWidth: 1,
    borderStyle: "dashed",
    borderColor: "#4B4C60",
    position: "absolute",
    top: 10,
    bottom: 10,
    left: "75%",
  },
  stubTop: {
    alignItems: "center",
  },
  stubEventShort: {
    fontSize: 9,
    color: "#D8D9F5",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  stubCode: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: 600,
    marginBottom: 6,
  },
  stubSecurity: {
    fontSize: 8,
    color: "#A0A1C0",
  },
  stubQRBox: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3A3B4D",
    padding: 4,
  },
  stubQRImage: {
    width: 60,
    height: 60,
  },
  stubBottomText: {
    fontSize: 7,
    color: "#7F8095",
    textAlign: "center",
    marginTop: 4,
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
  securityCode,
}) => (
  <Document>
    {/* Usamos A5 para que el contenido se vea más grande en el visor */}
    <Page size="A5" style={styles.page}>
      <View style={styles.container}>
        {/* Línea de perforación del talonario */}
        <View style={styles.perforation} />

        {/* Marca de agua central */}
        {logoUrl && (
          <View style={styles.watermarkContainer}>
            <Image style={styles.watermarkImage} src={logoUrl} />
          </View>
        )}

        {/* LADO PRINCIPAL */}
        <View style={styles.ticketLeft}>
          {/* HEADER */}
          <View style={styles.header}>
            {logoUrl ? <Image style={styles.logo} src={logoUrl} /> : null}
            <View style={styles.headerTextBlock}>
              <Text style={styles.eventTitle}>{eventName}</Text>
              <Text style={styles.eventSubtitle}>Core Sync Collective</Text>
            </View>
          </View>

          {/* BODY */}
          <View style={styles.body}>
            {/* textura industrial */}
            <View style={styles.textureStrip}>
              <View style={styles.textureBlock} />
              <View style={styles.textureBlockAlt} />
              <View style={styles.textureBlock} />
              <View style={styles.textureBlockAlt} />
            </View>

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

            {/* QR + seguridad + holograma */}
            <View style={styles.qrAndSecurityRow}>
              <View style={styles.qrContainer}>
                <View style={styles.qrBox}>
                  <Image
                    style={styles.qrImage}
                    src={`data:image/png;base64,${qrBase64}`}
                  />
                </View>
              </View>

              <View style={styles.securityBlock}>
                <Text style={styles.securityLabel}>Código de seguridad</Text>
                <Text style={styles.securityCode}>{securityCode}</Text>

                <View style={styles.hologramOuter}>
                  <View style={styles.hologramInner}>
                    <View style={styles.hologramStrip1} />
                    <View style={styles.hologramStrip2} />
                    <View style={styles.hologramStrip3} />
                  </View>

                  <View style={styles.hologramGloss} />

                  <View style={styles.hologramOverlay}>
                    <Text style={styles.hologramText}>CORE SYNC AUTH</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerTextMain}>
              <Text style={styles.hashtag}>#CoreSync</Text> | Presenta este
              ticket en la entrada.
            </Text>
            <Text style={styles.footerTextSub}>
              Entrada personal e intransferible. Prohibida su reventa. El código
              QR y el código de seguridad son únicos y serán validados una sola
              vez en el punto de acceso. La organización se reserva el derecho
              de admisión.
            </Text>
          </View>
        </View>

        {/* TALONARIO LATERAL */}
        <View style={styles.ticketRight}>
          <View style={styles.stubTop}>
            <Text style={styles.stubEventShort}>Core Sync</Text>
            <Text style={styles.stubCode}>#{codigo}</Text>
            <Text style={styles.stubSecurity}>SEC: {securityCode}</Text>

            <View style={styles.stubQRBox}>
              <Image
                style={styles.stubQRImage}
                src={`data:image/png;base64,${qrBase64}`}
              />
            </View>
          </View>

          <Text style={styles.stubBottomText}>
            Cortar por la línea punteada. Conservar este talón para control
            interno.
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default TicketPDF;