"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Result } from '@zxing/library';

// Importa el QR Reader
const QrReader = dynamic(
  () => import("@blackbox-vision/react-qr-reader").then(mod => mod.QrReader),
  { ssr: false }
);

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

  // Cambia la firma:
  const handleResult = async (result: Result | null | undefined) => {
    if (!!result && result.getText) {
      const text = result.getText();
      const parts = text.split("|");
      const codigo = parts[1];
      if (!codigo) {
        setMsg("QR inválido");
        return;
      }
      const res = await fetch(`/api/validar-ticket?codigo=${codigo}`);
      const r = await res.json();
      if (r.ok) setData(r);
      else setMsg(r.error || "No válido");
    }
    // Puedes mostrar error si quieres:
    // if (!!error) setMsg("No se pudo leer el QR");
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-2">Validar Ticket QR</h1>
      <div className="my-4 w-[280px] h-[280px]">
        <QrReader
          constraints={{ facingMode: "environment" }}
          onResult={handleResult}
          containerStyle={{ width: "100%", height: "100%" }}
          videoStyle={{ width: "100%", height: "100%" }}
        />
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