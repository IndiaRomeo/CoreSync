"use client";
import { useState } from "react";

type Ticket = {
  codigo: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
  usado?: boolean;
  usadoEn?: string | null;
};

export default function SelfCheck() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) {
      setError("Ingresa tu correo o número de teléfono");
      setData([]);
      return;
    }

    setLoading(true);
    setError("");
    setData([]);

    try {
      const res = await fetch(
        `/api/self-check?query=${encodeURIComponent(q)}`
      );
      if (res.ok) {
        const json = await res.json();
        const tickets: Ticket[] = json.tickets || [];
        setData(tickets);
        if (!tickets.length) {
          setError(
            "No encontramos boletas con esos datos. Verifica tu correo o teléfono."
          );
        }
      } else {
        setError("No se encontró el ticket.");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const hasResults = data.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Header estilo Core Sync */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-400">
              Core Sync Collective
            </p>
            <h1 className="text-lg font-semibold">
              Consulta de Tickets
            </h1>
          </div>

          {hasResults && (
            <div className="text-right text-[11px] text-slate-400">
              <p>Boletas encontradas:</p>
              <p className="font-semibold text-emerald-400 text-sm">
                {data.length}
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex justify-center">
        <div className="w-full max-w-3xl px-4 py-8 space-y-8">
          {/* Tarjeta de búsqueda */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-semibold mb-1">
              Revisa tus boletas
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Escribe el <span className="font-semibold">correo</span> con el
              que hiciste la compra o tu{" "}
              <span className="font-semibold">número de teléfono</span> (sin
              espacios). Te mostraremos todas las boletas asociadas.
            </p>

            <form
              onSubmit={handleCheck}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <input
                className="flex-1 border border-slate-700 bg-slate-950 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ej: usuario@gmail.com o 3152508701"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                className="mt-1 sm:mt-0 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors"
                disabled={loading}
              >
                {loading ? "Consultando..." : "Consultar boletas"}
              </button>
            </form>

            {error && (
              <div className="mt-3 text-xs text-rose-300 bg-rose-900/40 border border-rose-700/60 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            {!hasResults && !error && !loading && (
              <p className="mt-3 text-[11px] text-slate-500">
                Tip: si no recuerdas el correo exacto, prueba con tu número de
                celular en formato continuo (ej. 3152508701).
              </p>
            )}
          </section>

          {/* Resultados */}
          {hasResults && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">
                Tus boletas encontradas
              </h3>

              <div
                className={
                  data.length === 1
                    ? "max-w-md w-full"
                    : "w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                }
              >
                {data.map((ticket, idx) => {
                  const estadoLower = ticket.estado?.toLowerCase() || "";
                  const isPagado =
                    estadoLower === "pagado" || estadoLower === "aprobado";
                  const isReservado =
                    estadoLower === "reservado" ||
                    estadoLower === "pendiente";

                  const baseCard =
                    "relative rounded-2xl p-4 shadow-lg border overflow-hidden flex flex-col gap-1";

                  const cardColors = isPagado
                    ? "bg-emerald-900/80 border-emerald-400/80"
                    : isReservado
                    ? "bg-amber-900/80 border-amber-400/80"
                    : "bg-slate-900/80 border-slate-500/60";

                  return (
                    <article
                      key={ticket.codigo || idx}
                      className={`${baseCard} ${cardColors}`}
                    >
                      {/* Badge estado arriba derecha */}
                      <div className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full border border-white/20 bg-black/25 uppercase tracking-wide">
                        {ticket.usado ? "USADO" : "VIGENTE"}
                      </div>

                      {/* Código grande */}
                      <div className="font-mono text-sm text-slate-200">
                        Código
                      </div>
                      <div className="font-mono text-xl font-semibold text-white tracking-[0.15em]">
                        {(ticket.codigo || "").toUpperCase()}
                      </div>

                      <hr className="my-2 border-slate-600/60" />

                      {/* Nombre / contacto */}
                      <div className="text-xs text-slate-300">
                        Nombre:&nbsp;
                        <span className="font-semibold">
                          {ticket.nombre || "Sin nombre"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        Contacto:&nbsp;
                        <span className="font-mono">
                          {ticket.email || ticket.telefono || "-"}
                        </span>
                      </div>

                      {/* Estado */}
                      <div className="mt-2 text-xs">
                        Estado:&nbsp;
                        <span
                          className={
                            isPagado
                              ? "font-semibold text-emerald-300"
                              : isReservado
                              ? "font-semibold text-amber-200"
                              : "font-semibold text-slate-200"
                          }
                        >
                          {ticket.estado || "Desconocido"}
                        </span>
                      </div>

                      {ticket.usado && (
                        <div className="text-[11px] text-slate-300/80 mt-1">
                          Esta boleta ya fue marcada como usada en el acceso
                          al evento.
                        </div>
                      )}

                      <div className="mt-3 text-[10px] text-slate-400">
                        Si tienes dudas, muestra este código al personal de
                        ingreso o contáctanos por nuestros canales oficiales.
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}