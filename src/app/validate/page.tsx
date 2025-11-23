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
    <div className="relative flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-2">Validador de tickets</h1>

      {/* 🔔 Banner flotante de resultado (arriba, muy visible) */}
      {(data || msg) && (
        <div className="fixed inset-x-0 top-3 z-50 flex justify-center">
          <div
            className={
              "w-[92%] max-w-md rounded-2xl px-4 py-3 shadow-xl border backdrop-blur " +
              (data
                ? "bg-emerald-900/95 border-emerald-400 text-emerald-50"
                : "bg-rose-900/95 border-rose-400 text-rose-50")
            }
          >
            <div className="flex items-center gap-3">
              {data ? (
                <AiOutlineCheckCircle
                  className="text-emerald-300 flex-shrink-0"
                  size={32}
                />
              ) : (
                <AiOutlineCloseCircle
                  className="text-rose-300 flex-shrink-0"
                  size={32}
                />
              )}

              <div className="flex flex-col text-sm">
                <span className="font-semibold text-base">
                  {data ? "¡TICKET VÁLIDO!" : "Ticket no válido"}
                </span>

                {data ? (
                  <>
                    <span>Código: {data.codigo}</span>
                    <span>Nombre: {data.nombre}</span>
                    <span>Tel: {data.telefono}</span>
                    <span className="text-xs opacity-80">
                      Email: {data.email}
                    </span>
                  </>
                ) : (
                  <span className="text-xs opacity-90">{msg}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {validador && (
        <div className="flex items-center justify-between w-full max-w-xs mb-4 mt-10">
          <div className="flex flex-col text-sm text-gray-300">
            <p>
              Validador activo: <strong>{validador}</strong>
            </p>
            <p className="text-gray-400">
              Tickets validados: {contador}
            </p>
          </div>
          <button
            className="text-red-400 text-sm underline ml-4"
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
            <p className="text-gray-400 text-sm mt-2 text-center">
              Apunta al código QR del ticket
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
            className="flex flex-col gap-2 border border-white/10 rounded-xl p-3 bg-slate-900/60"
          >
            <h2 className="font-semibold text-sm text-white">
              Validar por código de ticket
            </h2>
            <p className="text-[11px] text-gray-400">
              Escribe el código impreso en la boleta (ej. CS-390388).
            </p>
            <input
              type="text"
              value={codigoManual}
              onChange={(e) => setCodigoManual(e.target.value)}
              placeholder="Ej: CS-390388"
              className="border border-white/10 bg-slate-900/80 rounded px-2 py-1 text-sm text-white placeholder:text-gray-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 transition text-white text-sm rounded py-1 font-semibold"
            >
              Validar código
            </button>
          </form>

          {/* Código de seguridad */}
          <form
            onSubmit={handleValidateBySecurity}
            className="flex flex-col gap-2 border border-white/10 rounded-xl p-3 bg-slate-900/60"
          >
            <h2 className="font-semibold text-sm text-white">
              Validar por código de seguridad
            </h2>
            <p className="text-[11px] text-gray-400">
              Úsalo como respaldo si el QR no se puede leer.
            </p>
            <input
              type="text"
              value={securityManual}
              onChange={(e) => setSecurityManual(e.target.value)}
              placeholder="Ej: 9F3A2C"
              className="border border-white/10 bg-slate-900/80 rounded px-2 py-1 text-sm text-white placeholder:text-gray-500"
            />
            <button
              type="submit"
              className="bg-fuchsia-600 hover:bg-fuchsia-500 transition text-white text-sm rounded py-1 font-semibold"
            >
              Validar código de seguridad
            </button>
          </form>
        </div>
      )}

      {/* Login de validador */}
      {!validador && (
        <div className="w-full max-w-xs mb-6 mt-6">
          <h2 className="text-lg font-semibold mb-2">
            Inicia sesión como validador
          </h2>
          <input
            type="text"
            placeholder="Nombre"
            className="w-full mb-2 border border-white/10 bg-slate-900/80 p-2 rounded text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="PIN"
            className="w-full mb-2 border border-white/10 bg-slate-900/80 p-2 rounded text-white"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <button
            className="w-full bg-blue-600 hover:bg-blue-500 transition text-white rounded py-2 font-semibold"
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