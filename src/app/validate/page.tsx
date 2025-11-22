"use client";
import { useState, useRef, useEffect, FormEvent } from "react";
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
  const [contador, setContador] = useState(0);

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [validador, setValidador] = useState("");

  // inputs manuales
  const [codigoManual, setCodigoManual] = useState("");
  const [securityManual, setSecurityManual] = useState("");

  useEffect(() => {
    const savedValidador = localStorage.getItem("validador");
    if (savedValidador) {
      setValidador(savedValidador);
      const savedContador = localStorage.getItem(
        `contador_${savedValidador}`
      );
      if (savedContador) {
        setContador(parseInt(savedContador, 10));
      }
    }
  }, []);

  function resetAfter(ms: number) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setMsg("");
      setData(null);
      setScanned(false);
      setIsFetching(false);
    }, ms);
  }

  // Función reutilizable para llamar al endpoint
  const callValidateTicket = async (
    queryString: string,
    codigoCache?: string
  ) => {
    if (!validador) {
      setMsg("Primero inicia sesión como validador");
      resetAfter(3000);
      return;
    }

    if (scanned || isFetching) return;

    setIsFetching(true);
    setScanned(true);
    setMsg("");
    setData(null);

    try {
      const url = `/api/validate-ticket?${queryString}&validador=${encodeURIComponent(
        validador
      )}`;
      const res = await fetch(url);
      const r = await res.json();

      if (r.ok) {
        setData(r);
        playBeep("ok");
        setContador((prev) => {
          const nuevo = prev + 1;
          localStorage.setItem(
            `contador_${validador}`,
            nuevo.toString()
          );
          return nuevo;
        });

        if (codigoCache) {
          scannedCodesRef.current.add(codigoCache);
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        resetAfter(5000);
      } else {
        setMsg(r.error || "No válido");
        playBeep("fail");

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

  // Escaneo QR
  const handleResult = async (qrValue: string) => {
    if (!qrValue) return;

    // seguimos extrayendo el código para el cache local, pero
    // el backend ahora se encarga de interpretar el QR
    const parts = qrValue.split("|");
    const codigo = parts[1] || parts[0];

    if (!codigo) {
      setMsg("Código QR inválido");
      resetAfter(2500);
      return;
    }

    await callValidateTicket(
      `qr=${encodeURIComponent(qrValue)}`,
      codigo
    );
  };

  // Validar por código de ticket
  const handleValidateByCodigo = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const cod = codigoManual.trim();
    if (!cod) {
      setMsg("Ingresa un código de ticket");
      resetAfter(2000);
      return;
    }

    await callValidateTicket(
      `codigo=${encodeURIComponent(cod)}`,
      cod
    );
    setCodigoManual("");
  };

  // Validar por código de seguridad
  const handleValidateBySecurity = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const sec = securityManual.trim();
    if (!sec) {
      setMsg("Ingresa un código de seguridad");
      resetAfter(2000);
      return;
    }

    await callValidateTicket(`sec=${encodeURIComponent(sec)}`, sec);
    setSecurityManual("");
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-2">Validar Ticket</h1>

      {validador && (
        <div className="flex items-center justify-between w-full max-w-xs mb-4">
          <div className="flex flex-col text-sm text-gray-700">
            <p>
              Validador activo: <strong>{validador}</strong>
            </p>
            <p className="text-gray-600">
              Tickets validados: {contador}
            </p>
          </div>
          <button
            className="text-red-600 text-sm underline ml-4"
            onClick={() => {
              const currentValidador = validador;
              setValidador("");
              setUsername("");
              setPin("");
              setData(null);
              setContador(0);
              scannedCodesRef.current.clear();
              localStorage.removeItem("validador");
              if (currentValidador) {
                localStorage.removeItem(
                  `contador_${currentValidador}`
                );
              }
              setMsg("Sesión cerrada");
              resetAfter(2000);
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}

      {/* Sección de escaneo QR */}
      {validador && (
        <div className="my-4">
          {!scanned && <QrScanner onResult={handleResult} />}
          {!scanned && (
            <p className="text-gray-500 text-sm mt-2">
              Escaneando QR...
            </p>
          )}
        </div>
      )}

      {/* Formularios manuales (código y código de seguridad) */}
      {validador && (
        <div className="w-full max-w-sm mt-4 space-y-4">
          {/* Código de ticket */}
          <form
            onSubmit={handleValidateByCodigo}
            className="flex flex-col gap-2 border rounded p-3 bg-white/60"
          >
            <h2 className="font-semibold text-sm">
              Validar por código de ticket
            </h2>
            <input
              type="text"
              value={codigoManual}
              onChange={(e) => setCodigoManual(e.target.value)}
              placeholder="Ej: CS-390388"
              className="border rounded px-2 py-1 text-sm"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white text-sm rounded py-1"
            >
              Validar código
            </button>
          </form>

          {/* Código de seguridad */}
          <form
            onSubmit={handleValidateBySecurity}
            className="flex flex-col gap-2 border rounded p-3 bg-white/60"
          >
            <h2 className="font-semibold text-sm">
              Validar por código de seguridad
            </h2>
            <input
              type="text"
              value={securityManual}
              onChange={(e) => setSecurityManual(e.target.value)}
              placeholder="Ej: 9F3A2C"
              className="border rounded px-2 py-1 text-sm"
            />
            <button
              type="submit"
              className="bg-purple-600 text-white text-sm rounded py-1"
            >
              Validar código de seguridad
            </button>
          </form>
        </div>
      )}

      {/* Mensaje de éxito */}
      {data && (
        <div className="bg-green-200 rounded p-3 text-center mt-3 flex flex-col items-center">
          <AiOutlineCheckCircle
            className="text-green-700 animate-pulse"
            size={48}
          />
          <div className="text-lg font-bold text-green-700">
            ¡TICKET VÁLIDO!
          </div>
          <p className="text-sm text-green-900">
            Nombre: {data.nombre}
          </p>
          <p className="text-sm text-green-900">
            Teléfono: {data.telefono}
          </p>
          <p className="text-sm text-green-900">
            Email: {data.email}
          </p>
          <p className="text-sm text-green-900">
            Estado: {data.estado}
          </p>
        </div>
      )}

      {/* Mensaje de error */}
      {msg && (
        <div className="bg-red-100 rounded p-3 text-center mt-3 flex flex-col items-center">
          <AiOutlineCloseCircle
            className="text-red-700"
            size={48}
          />
          <div className="text-lg font-bold text-red-700">{msg}</div>
        </div>
      )}

      {/* Login de validador */}
      {!validador && (
        <div className="w-full max-w-xs mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Inicia sesión como validador
          </h2>
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
                localStorage.setItem("validador", username);
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