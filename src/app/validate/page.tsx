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

const VALIDADORES: Record<string, string> = {
  Ana: "1234",
  Juan: "5678",
  Luis: "0000",
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

    const [username, setUsername] = useState("");
    const [pin, setPin] = useState("");
    const [validador, setValidador] = useState("");

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
    if (!validador) {
      setMsg("Primero inicia sesión como validador");
      resetAfter(3000);
      return;
    }
    setIsFetching(true);
    //if (scanned) return;

    // Extraer el código
    const parts = qrValue.split("|");
    const codigo = parts[1];

    // Validar existencia y formato del código
    if (!codigo) {
      setMsg("Código QR inválido");
      resetAfter(2500); // ← añade esto para limpiar el mensaje
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
      const res = await fetch(`/api/validate-ticket?codigo=${codigo}&validador=${encodeURIComponent(validador)}`);
      //const res = await fetch(`/api/validate-ticket?codigo=${codigo}`);
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
      {validador && (
        <p className="mb-2 text-sm text-gray-700">
          Validador activo: <strong>{validador}</strong>
        </p>
      )}
      {validador && (
        <div className="my-4">
          {!scanned && <QrScanner onResult={handleResult} />}
          {!scanned && <p className="text-gray-500 text-sm mt-2">Escaneando QR...</p>}
        </div>
      )}
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

      {!validador && (
        <div className="w-full max-w-xs mb-6">
          <h2 className="text-lg font-semibold mb-2">Inicia sesión como validador</h2>
          <input
            type="text"
            placeholder="Nombre"
            className="w-full mb-2 border p-2 rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="PIN"
            className="w-full mb-2 border p-2 rounded"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <button
            className="w-full bg-blue-600 text-white rounded py-2"
            onClick={() => {
              const claveCorrecta = VALIDADORES[username];
              if (claveCorrecta && claveCorrecta === pin) {
                setValidador(username);
              } else {
                setMsg("Nombre o PIN incorrecto");
                resetAfter(3000);
              }
            }}
          >
            Iniciar sesión
          </button>
        </div>
      )}
    </div>
  );
}