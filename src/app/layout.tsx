import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Orbitron } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Core Sync Collective - Evento Techno en Mariquita",
  description: "Fiesta Techno | Core Sync Collective | 16 Agosto 2025 | San Sebastián de Mariquita | ¡Compra tu entrada ya!",
  openGraph: {
    title: "Core Sync Collective - Fiesta Techno",
    description: "No te pierdas el evento del año: Agosto, Mariquita. Boletas limitadas. ¡Compra ahora!",
    url: "https://collectivecoresync.com/",
    siteName: "Core Sync Collective",
    images: [
      {
        url: "https://collectivecoresync.com/evento-foto.jpg",
        width: 1200,
        height: 630,
        alt: "Flyer Core Sync Collective",
      },
    ],
    locale: "es_CO",
    type: "website",
  },
  // Puedes agregar más propiedades aquí si quieres
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}