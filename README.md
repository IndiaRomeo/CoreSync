# Core Sync Collective – Registro y Control de Boletas

Web Node.js/Next.js para gestión de eventos de música electrónica, sencillo y fácil de usar.

Web app for electronic music event management, simple and easy to use.

---

## 📋 Descripción / Description

**ES:**  
Esta plataforma permite registrar compradores de boletas, generar códigos QR únicos, administrar entradas desde un panel seguro y exportar datos fácilmente. Pensada para eventos de música electrónica tipo rave, club, techno y similares.

**EN:**  
This platform allows you to register ticket buyers, generate unique QR codes, manage entries from a secure admin panel, and export data easily. Designed for electronic music events like raves, clubs, techno, and more.

---

## 🚀 Deploy / Despliegue

### En Vercel / On Vercel

1. **Clona este repositorio** y haz deploy en [Vercel](https://vercel.com).
2. En **Settings → Environment Variables**, agrega:
    - `ADMIN_PASSWORD` = tu clave de acceso / your admin password
    - `GOOGLE_CREDENTIALS_JSON` = el JSON del Service Account (Google Sheets) / (paste your Google Service Account JSON in a single line)
3. Sube tu logo QR a `/public/logo-qr.png` (logo para el centro del QR).
4. Haz deploy.

---

## 🖥️ Local Development / Desarrollo Local

```bash
npm install
npm run dev
