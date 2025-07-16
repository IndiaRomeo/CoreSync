"use client";
import { useState, useRef } from "react";
import QrScanner from "@/components/QrScanner";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

// Define el tipo de los datos del ticket
type TicketData = {
  codigo: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
};

// Reproduce sonido según el tipo ("ok" o "fail")
// Asegúrate de tener ok.mp3 y fail.mp3 en tu carpeta /public
function playBeep(type: "ok" | "fail" = "ok") {
  const url = type === "ok" ? "/ok.mp3" : "/fail.mp3";
  const audio = new Audio(url);
  audio.play();
}

export default function Validador() {
  const [data, setData] = useState<TicketData | null>(null);
  const [msg, setMsg] = useState("");
  const [scanned, setScanned] = useState(false);

  const scannedCodesRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleResult = async (qrValue: string) => {
    if (scanned) return;
    // Limpia timeout anterior si lo hay
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Extraer el código desde el QR (ej: CoreSync|CS-xxxx|nombre|tel|mail)
    const parts = qrValue.split("|");
    const codigo = parts[1];

    if (!codigo) {
      setMsg("QR inválido");
      setScanned(true);
      timeoutRef.current = setTimeout(() => {
        setMsg("");
        setScanned(false);
      }, 2500);
      return;
    }

    // Si el código YA fue escaneado en la sesión actual:
    if (scannedCodesRef.current.has(codigo)) {
      setMsg("Este ticket ya fue validado.");
      setScanned(true);
      playBeep("fail");
      if (typeof window !== "undefined" && window.navigator.vibrate) {
        window.navigator.vibrate([250, 100, 250]);
      }
      timeoutRef.current = setTimeout(() => {
        setMsg("");
        setScanned(false);
      }, 3500);
      return;
    }

    setScanned(true);
    setMsg("");
    setData(null);

    try {
      const res = await fetch(`/api/validate-ticket?codigo=${codigo}`);
      const r = await res.json();
      if (r.ok) {
        setData(r);
        playBeep("ok");
        if (typeof window !== "undefined" && window.navigator.vibrate) {
          window.navigator.vibrate(120);
        }
        scannedCodesRef.current.add(codigo);

        timeoutRef.current = setTimeout(() => {
          setData(null);
          setScanned(false);
        }, 5000); // 5 segundos visible
      } else {
        setMsg(r.error || "No válido");
        playBeep("fail");
        if (typeof window !== "undefined" && window.navigator.vibrate) {
          window.navigator.vibrate([250, 100, 250]);
        }
        // Si el error es "ya fue usado" dale un poco más de tiempo
        const time =
          r.error === "Este ticket ya fue usado." ? 3500 : 2500;
        timeoutRef.current = setTimeout(() => {
          setMsg("");
          setScanned(false);
        }, time);
      }
    } catch {
      setMsg("Error de red");
      setScanned(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-2">Validar Ticket QR</h1>
      <div className="my-4">{!scanned && <QrScanner onResult={handleResult} />}</div>

      {/* Feedback de éxito */}
      {data && (
        <div className="bg-green-200 rounded p-3 text-center mt-3 flex flex-col items-center">
          <AiOutlineCheckCircle className="text-green-700 mb-2" size={48} />
          <div className="text-lg font-bold text-green-700">¡TICKET VÁLIDO!</div>
          <div className="font-semibold text-gray-900 mt-2">Nombre: {data.nombre}</div>
          <div className="text-sm">Código: {data.codigo}</div>
          <div className="text-sm">Estado: {data.estado}</div>
        </div>
      )}

      {/* Feedback de error */}
      {msg && (
        <div className="bg-red-100 rounded p-3 text-center mt-3 flex flex-col items-center">
          <AiOutlineCloseCircle className="text-red-700 mb-2" size={48} />
          <div className="text-lg font-bold text-red-700">{msg}</div>
        </div>
      )}
    </div>
  );
}