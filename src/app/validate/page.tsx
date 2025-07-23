"use client";
import { useState, useRef } from "react";
import QrScanner from "@/components/QrScanner";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

type TicketData = {
  codigo: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
};

function playBeep(type = "ok") {
  const url = type === "ok" ? "/ok.mp3" : "/fail.mp3";
  // Siempre crea un nuevo objeto Audio (mejor para móviles y Safari)
  const audio = new window.Audio(url);
  audio.volume = 1;
  audio.play().catch(() => {
    // Ignora el error de autoplay bloqueado
  });
}



export default function Validador() {
    const [data, setData] = useState<TicketData | null>(null);
    const [msg, setMsg] = useState("");
    const [scanned, setScanned] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const scannedCodesRef = useRef<Set<string>>(new Set());
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    function resetAfter(ms: number) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setMsg("");
        setData(null);
        setScanned(false);
        setIsFetching(false);
      }, ms);
    }

    const handleResult = async (qrValue: string) => {

    if (scanned || isFetching) return;
    setIsFetching(true);
    //if (scanned) return;

    // Extraer el código
    const parts = qrValue.split("|");
    const codigo = parts[1];

    // Validar existencia y formato del código
    if (!codigo || !/^[a-zA-Z0-9]+$/.test(codigo)) {
      setMsg("Código QR inválido");
      return;
    }

    /*if (!codigo) {
      setMsg("QR inválido");
      return;
    }*/

    // Si el código YA fue escaneado en la sesión actual:
    /*if (scannedCodesRef.current.has(codigo)) {
      setMsg("Este ticket ya fue validado.");
      setScanned(true);
      timeoutRef.current = setTimeout(() => {
        setMsg("");
        setScanned(false);
      }, 4000); // 5 segundos visible
      return;
    } */

    setScanned(true);
    setMsg("");
    setData(null);

    try {
      const res = await fetch(`/api/validate-ticket?codigo=${codigo}`);
      const r = await res.json();
      if (r.ok) {
        setData(r);
        // Vibración éxito
        playBeep("ok");

        scannedCodesRef.current.add(codigo); // GUARDAR CÓDIGO COMO USADO
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        resetAfter(5000);
      } else {
        setMsg(r.error || "No válido");

        // Vibración error
        playBeep("fail");

        // Aquí: Si el mensaje ES "ya fue usado", da más tiempo
        if (r.error === "Este ticket ya fue usado.") {
          resetAfter(3000);
        } else {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          resetAfter(2500);
        }
      }
    } catch {
      setMsg("Error de red");
      setScanned(false);
      setIsFetching(false);
    }
  };


  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-2">Validar Ticket QR</h1>
      <div className="my-4">
        {!scanned && <QrScanner onResult={handleResult} />}
        {!scanned && <p className="text-gray-500 text-sm mt-2">Escaneando QR...</p>}
      </div>
      {data && (
        <div className="bg-green-200 rounded p-3 text-center mt-3 flex flex-col items-center">
          <AiOutlineCheckCircle className="text-green-700 animate-pulse" size={48} />
          <div className="text-lg font-bold text-green-700">¡TICKET VÁLIDO!</div>
          <p className="text-sm">Nombre: {data.nombre}</p>
          <p className="text-sm">Teléfono: {data.telefono}</p>
          <p className="text-sm">Email: {data.email}</p>
          <p className="text-sm">Estado: {data.estado}</p>
          {/* ...otros datos */}
        </div>
      )}
      {msg && (
        <div className="bg-red-100 rounded p-3 text-center mt-3 flex flex-col items-center">
          <AiOutlineCloseCircle className="text-red-700" size={48} />
          <div className="text-lg font-bold text-red-700">{msg}</div>
        </div>
      )}
    </div>
  );
}