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
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Top bar / header */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-400">
              Core Sync Collective
            </p>
            <h1 className="text-lg font-semibold">
              Validador de tickets
            </h1>
          </div>

          {validador && (
            <div className="text-right text-xs">
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-3 py-1 border border-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium">{validador}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Tickets validados:{" "}
                <span className="font-semibold text-emerald-400">
                  {contador}
                </span>
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex justify-center">
        <div className="w-full max-w-xl px-4 py-6 space-y-6">
          {/* Login de validador */}
          {!validador && (
            <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h2 className="text-base font-semibold mb-2">
                Inicia sesión como validador
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Usa tu nombre y PIN asignado para empezar a escanear
                entradas en el evento.
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre"
                  className="w-full mb-1 border border-slate-700 bg-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="PIN"
                  className="w-full mb-1 border border-slate-700 bg-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
                <button
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg py-2 text-sm font-semibold transition-colors"
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
                  Entrar al validador
                </button>
              </div>
            </section>
          )}

          {/* Zona de escaneo + formularios */}
          {validador && (
            <>
              {/* Scanner card */}
              <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">
                    Escaneo rápido por QR
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cámara activa
                  </span>
                </div>

                <div className="mt-3">
                  <div className="relative w-full max-w-sm mx-auto aspect-[4/3] overflow-hidden rounded-2xl border border-slate-700 bg-black">
                    {/* Cámara */}
                    {!scanned && (
                      <div className="absolute inset-0">
                        <QrScanner onResult={handleResult} />
                      </div>
                    )}

                    {/* Overlay del marco */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="w-52 h-52 rounded-3xl border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]" />
                    </div>

                    {/* Texto inferior */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] text-slate-200/90">
                      Apunta al código QR del ticket
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-center text-slate-400">
                    Al escanear, el sistema marcará automáticamente el
                    ticket como usado y mostrará los datos del asistente.
                  </p>
                </div>
              </section>

              {/* Formularios manuales */}
              <section className="grid gap-4 md:grid-cols-2">
                <form
                  onSubmit={handleValidateByCodigo}
                  className="flex flex-col gap-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-4"
                >
                  <h3 className="font-semibold text-sm">
                    Validar por código de ticket
                  </h3>
                  <p className="text-[11px] text-slate-400 -mt-1">
                    Escribe el código impreso en la boleta (ej. CS-390388).
                  </p>
                  <input
                    type="text"
                    value={codigoManual}
                    onChange={(e) => setCodigoManual(e.target.value)}
                    placeholder="Ej: CS-390388"
                    className="border border-slate-700 bg-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="mt-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg py-2 font-semibold transition-colors"
                  >
                    Validar código
                  </button>
                </form>

                <form
                  onSubmit={handleValidateBySecurity}
                  className="flex flex-col gap-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-4"
                >
                  <h3 className="font-semibold text-sm">
                    Validar por código de seguridad
                  </h3>
                  <p className="text-[11px] text-slate-400 -mt-1">
                    Úsalo como respaldo si el QR no se puede leer.
                  </p>
                  <input
                    type="text"
                    value={securityManual}
                    onChange={(e) => setSecurityManual(e.target.value)}
                    placeholder="Ej: 9F3A2C"
                    className="border border-slate-700 bg-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                  <button
                    type="submit"
                    className="mt-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm rounded-lg py-2 font-semibold transition-colors"
                  >
                    Validar código de seguridad
                  </button>
                </form>
              </section>
            </>
          )}

          {/* Mensaje de éxito */}
          {data && (
            <section className="bg-emerald-100 rounded-2xl p-4 text-center mt-2 flex flex-col items-center shadow-lg">
              <AiOutlineCheckCircle
                className="text-emerald-700 animate-pulse mb-1"
                size={40}
              />
              <div className="text-base font-bold text-emerald-800">
                ¡TICKET VÁLIDO!
              </div>
              <p className="text-sm text-emerald-900 mt-2">
                Nombre: {data.nombre}
              </p>
              <p className="text-sm text-emerald-900">
                Teléfono: {data.telefono}
              </p>
              <p className="text-sm text-emerald-900">
                Email: {data.email}
              </p>
              <p className="text-sm text-emerald-900">
                Estado: {data.estado}
              </p>
            </section>
          )}

          {/* Mensaje de error */}
          {msg && (
            <section className="bg-rose-100 rounded-2xl p-4 text-center mt-2 flex flex-col items-center shadow-lg">
              <AiOutlineCloseCircle
                className="text-rose-700 mb-1"
                size={40}
              />
              <div className="text-base font-bold text-rose-700">
                {msg}
              </div>
            </section>
          )}

          {/* Botón cerrar sesión (ya está arriba, pero aquí queda la separación visual) */}
          {validador && (
            <div className="text-center text-[11px] text-slate-500 mt-4">
              Core Sync · Módulo de validación interno
            </div>
          )}
        </div>
      </main>
    </div>
  );
}