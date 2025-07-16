"use client";
import { useState, useRef } from "react";
import QrScanner from "@/components/QrScanner";

type TicketData = {
  codigo: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
};

export default function Validador() {
  const [data, setData] = useState<TicketData | null>(null);
  const [msg, setMsg] = useState("");
  const [scanned, setScanned] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleResult = async (qrValue: string) => {
    if (scanned) return; // Evita escanear muchas veces el mismo QR rápido
    setScanned(true);

    // Limpia estado antes de un nuevo escaneo
    setMsg("");
    setData(null);

    // Extraer el código
    const parts = qrValue.split("|");
    const codigo = parts[1];
    if (!codigo) {
      setMsg("QR inválido");
      setScanned(false);
      return;
    }

    try {
      const res = await fetch(`/api/validate-ticket?codigo=${codigo}`);
      const r = await res.json();
      if (r.ok) {
        setData(r);
        // Oculta el mensaje luego de 2 segundos
        timeoutRef.current = setTimeout(() => {
          setData(null);
          setScanned(false);
        }, 2000);
      } else {
        setMsg(r.error || "No válido");
        setScanned(false);
      }
    } catch {
      setMsg("Error de red");
      setScanned(false);
    }
  };

  // Limpieza al desmontar
  // (opcional si quieres evitar fugas de memoria)
  // useEffect(() => {
  //   return () => {
  //     if (timeoutRef.current) clearTimeout(timeoutRef.current);
  //   };
  // }, []);

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-2">Validar Ticket QR</h1>
      <div className="my-4">
        {/* Puedes desactivar el scanner mientras muestras el resultado */}
        {!scanned && <QrScanner onResult={handleResult} />}
      </div>
      {data && (
        <div className="bg-green-200 rounded p-3 text-center mt-3">
          <div className="text-lg font-bold text-green-700">¡TICKET VÁLIDO!</div>
          <div className="font-semibold text-gray-900">Nombre: {data.nombre}</div>
          <div className="text-sm">Código: {data.codigo}</div>
          <div className="text-sm">Estado: {data.estado}</div>
        </div>
      )}
      {msg && <div className="bg-red-100 text-red-700 mt-3 px-3 py-2 rounded">{msg}</div>}
    </div>
  );
}