Core Sync Collective – Registro y Control de Boletas
Web Node.js/Next.js para gestión de eventos de música electrónica, sencillo y fácil de usar.

Web app for electronic music event management, simple and easy to use.

📋 Descripción / Description
ES:
Esta plataforma permite registrar compradores de boletas, generar códigos QR únicos, administrar entradas desde un panel seguro y exportar datos fácilmente.
Valor agregado: Utiliza la API de Google Sheets como base de datos en la nube, permitiendo llevar el control de ventas y accesos en un Excel compartido, sin necesidad de empresa registrada, rut, o conocimientos avanzados. Ideal para quienes empiezan su emprendimiento y necesitan algo rápido, seguro y gratis.

EN:
This platform allows you to register ticket buyers, generate unique QR codes, manage entries from a secure admin panel, and export data easily.
Added value: It uses the Google Sheets API as a cloud database, so you can keep sales and access control in a shared spreadsheet (Excel style), with no need for a registered company or technical setup. Perfect for new projects and small collectives who want something fast, safe, and free.

🚀 Deploy / Despliegue
En Vercel / On Vercel
Clona este repositorio y haz deploy en Vercel.
Clone this repository and deploy on Vercel.

En Settings → Environment Variables, agrega:
In Settings → Environment Variables, add:

ADMIN_PASSWORD = tu clave de acceso / your admin password

GOOGLE_CREDENTIALS_JSON = el JSON del Service Account (Google Sheets) / (paste your Google Service Account JSON in a single line)

Sube tu logo QR a /public/logo-qr.png (logo para el centro del QR).
Upload your QR logo to /public/logo-qr.png (used for center of QR).

Haz deploy.
Deploy and enjoy!

🖥️ Local Development / Desarrollo Local
bash
Copiar
Editar
npm install
npm run dev
🌟 Características / Features
Panel admin seguro con login (clave) / Secure admin panel with login.

Registro fácil de compradores y generación de QR únicos / Easy ticket buyer registration & unique QR generation.

Estadísticas en tiempo real y descarga de Excel / Real-time stats & Excel/CSV export.

Control total desde Google Sheets (puedes compartir, editar, imprimir o usar como backup) / Full control via Google Sheets (share, edit, print, or backup anytime).

100% responsive para móvil/tablet/PC / 100% responsive: works on mobile, tablet, PC.

Sin base de datos ni backend complicado, solo necesitas una cuenta Google / No database or backend setup needed, just a Google account.

Demo
Core Sync Collective
https://core-sync-gamma.vercel.app/
