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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleResult = async (qrValue: string) => {
    // Si ya hay mensaje, no escanear de nuevo
    if (data || msg) return;

    const parts = qrValue.split("|");
    const codigo = parts[1];
    if (!codigo) {
      setMsg("QR inválido");
      timeoutRef.current = setTimeout(() => setMsg(""), 3500); // 3.5 seg
      return;
    }
    try {
      const res = await fetch(`/api/validate-ticket?codigo=${codigo}`);
      const r = await res.json();
      if (r.ok) {
        setData(r);
        timeoutRef.current = setTimeout(() => setData(null), 3500); // 3.5 seg
      } else {
        setMsg(r.error || "No válido");
        timeoutRef.current = setTimeout(() => setMsg(""), 3500); // 3.5 seg
      }
    } catch {
      setMsg("Error de red");
      timeoutRef.current = setTimeout(() => setMsg(""), 3500);
    }
  };

  // Limpiar timeout cuando cambias de mensaje/data
  // Opcional: para evitar conflictos si el usuario escanea muy rápido
  // useEffect(() => {
  //   return () => {
  //     if (timeoutRef.current) clearTimeout(timeoutRef.current);
  //   };
  // }, []);

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-2">Validar Ticket QR</h1>
      <div className="my-4">
        <QrScanner onResult={handleResult} />
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