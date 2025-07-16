import fs from "fs";
export default function handler(req, res) {
  try {
    const fontData = fs.readFileSync(process.cwd() + "/fonts/Orbitron.ttf");
    res.setHeader("Content-Type", "font/ttf");
    res.status(200).send(fontData);
  } catch (e) {
    res.status(500).send("No se pudo leer fuente: " + e.message);
  }
}