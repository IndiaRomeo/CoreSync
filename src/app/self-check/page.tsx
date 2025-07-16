"use client";
import { useState } from "react";

type Ticket = {
  codigo: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
  usado?: boolean;
  qr?: string;
  [key: string]: string | boolean | undefined;
};


export default function SelfCheck() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setData([]);

    const res = await fetch(`/api/self-check?query=${encodeURIComponent(input)}`);
    if (res.ok) {
      const json = await res.json();
      setData(json.tickets || []);
      if (!json.tickets || !json.tickets.length) setError("No hay resultados");
    } else {
      setError("No se encontró el ticket.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-10">
      <form onSubmit={handleCheck} className="bg-gray-900 p-6 rounded-xl shadow-lg flex flex-col gap-3 w-full max-w-sm">
        <h2 className="text-xl font-bold text-white mb-2">Consulta tus boletas</h2>
        <input
          className="p-2 rounded bg-gray-800 text-white border border-gray-700"
          placeholder="Ingresa tu correo o teléfono"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit" className="bg-blue-700 text-white rounded px-4 py-2 font-bold" disabled={loading}>
          {loading ? "Consultando..." : "Consultar"}
        </button>
        {error && <div className="text-red-400 text-sm">{error}</div>}
      </form>

      {!!data.length && (
        <div className={`mt-8 w-full flex justify-center`}>
            <div className={
            data.length === 1
                ? "max-w-xs w-full flex justify-center"
                : "w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
            }>
            {data.map((ticket, idx) => (
                <div
                key={ticket.codigo || idx}
                className={`rounded-2xl shadow-xl p-5 flex flex-col items-center
                    ${ticket.estado?.toLowerCase() === "pagado" ? "bg-green-900/80 border-green-400"
                    : ticket.estado?.toLowerCase() === "reservado" ? "bg-yellow-800/70 border-yellow-400"
                    : "bg-gray-800/80 border-gray-400"}
                    border-2`}
                >
                <div className="font-mono text-lg font-bold mb-1">
                    #{(ticket.codigo || "").slice(-6)}
                </div>
                <div className="font-bold text-white mb-1">{ticket.nombre || "Sin nombre"}</div>
                <div className="text-xs text-gray-300 mb-1">{ticket.email || ticket.telefono}</div>
                <div className="mb-1">
                    Estado: <b className={
                    ticket.estado?.toLowerCase() === "pagado"
                        ? "text-green-300"
                        : ticket.estado?.toLowerCase() === "reservado"
                        ? "text-yellow-300"
                        : "text-gray-300"
                    }>{ticket.estado}</b>
                </div>
                </div>
            ))}
            </div>
        </div>
        )}
    </div>
  );
}