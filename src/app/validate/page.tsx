"use client";
import { useState } from "react";
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

  const handleResult = async (qrValue: string) => {
    // Extraer el código, ej: CoreSync|CS-xxxx|nombre|tel|mail
    const parts = qrValue.split("|");
    const codigo = parts[1];
    if (!codigo) {
      setMsg("QR inválido");
      return;
    }
    try {
      const res = await fetch(`/api/validate-ticket?codigo=${codigo}`);
      const r = await res.json();
      if (r.ok) setData(r);
      else setMsg(r.error || "No válido");
    } catch {
        setMsg("Error de red");
    }
  };

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