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
    const scannedCodesRef = useRef<Set<string>>(new Set());
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleResult = async (qrValue: string) => {
    if (scanned) return;

    // Extraer el código
    const parts = qrValue.split("|");
    const codigo = parts[1];

    if (!codigo) {
      setMsg("QR inválido");
      return;
    }

    // Si el código YA fue escaneado en la sesión actual:
    if (scannedCodesRef.current.has(codigo)) {
      setMsg("Este ticket ya fue validado.");
      setScanned(true);
      timeoutRef.current = setTimeout(() => {
        setMsg("");
        setScanned(false);
      }, 4000); // 5 segundos visible
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
        scannedCodesRef.current.add(codigo); // GUARDAR CÓDIGO COMO USADO
        timeoutRef.current = setTimeout(() => {
          setData(null);
          setScanned(false);
        }, 5000); // Dura 5 segundos visible
      } else {
        setMsg(r.error || "No válido");
        // Aquí: Si el mensaje ES "ya fue usado", da más tiempo
        if (r.error === "Este ticket ya fue usado.") {
          timeoutRef.current = setTimeout(() => {
            setMsg("");
            setScanned(false);
          }, 3000); // 5 segundos
        } else {
          timeoutRef.current = setTimeout(() => {
            setMsg("");
            setScanned(false);
          }, 2500); // Otros errores, menos tiempo
        }
      }
    } catch {
      setMsg("Error de red");
      setScanned(false);
    }
  };


  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-2">Validar Ticket QR</h1>
      <div className="my-4">
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