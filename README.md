# Core Sync Collective 🎶  
**Registro y Control de Boletas para Eventos Electrónicos**

[Demo online aquí](https://core-sync-gamma.vercel.app/)

---

## 📋 Descripción

**ES:**  
Plataforma para registrar compradores de boletas, generar QR únicos y administrar entradas desde un panel seguro.  
> 💡 **Valor agregado:** Usa Google Sheets como base de datos en la nube (tipo Excel), ideal para emprendimientos y eventos sin infra de empresa ni conocimientos técnicos. ¡Solo necesitas una cuenta Google!

**EN:**  
Platform to register ticket buyers, generate unique QR codes, and manage entries from a secure panel.  
> 💡 **Added value:** Uses Google Sheets as a cloud database (like Excel), perfect for small projects and events—no company setup or tech skills needed, just a Google account!

---

## 🚀 Despliegue / Deploy

### ☁️ En Vercel / On Vercel

1. Clona este repositorio y haz deploy en [Vercel](https://vercel.com/).
2. En **Settings → Environment Variables** agrega:
   - `ADMIN_PASSWORD` → tu clave admin / your admin password
   - `GOOGLE_CREDENTIALS_JSON` → tu Service Account JSON de Google Sheets (una sola línea)
3. Sube tu logo QR a `/public/logo-qr.png` (aparece en el centro de los QR).
4. Haz deploy. ¡Listo!

### 💻 Local Development

```bash
npm install
npm run dev
