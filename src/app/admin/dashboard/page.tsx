"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";

interface LogEntry {
  fecha: string;
  codigo: string;
  cedula?: string;
  nombre: string;
  email: string;
  estado: string;
  resultado: string;
  validador: string;
}

type StatCardProps = {
  label: string;
  value: number | string;
  subtitle?: string;
  color?: string;
};

function StatCard({ label, value, subtitle, color }: StatCardProps) {
  return (
    <div className="flex-1 min-w-[150px]">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/85 to-zinc-950/95 shadow-lg px-4 py-3">
        {color && (
          <div
            className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${color}`}
          />
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {label}
          </span>
          <span className="text-2xl font-extrabold tracking-tight">
            {value}
          </span>
          {subtitle && (
            <span className="text-[10px] text-zinc-500">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin-login")
      .then((res) => setIsAuth(res.ok))
      .catch(() => setIsAuth(false));
  }, []);

  useEffect(() => {
    fetch("/api/logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (isAuth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white text-xl">
        Cargando...
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white text-xl text-center px-4">
        Acceso restringido. <br />
        Debes iniciar sesión como administrador para ver el dashboard.
      </div>
    );
  }

  // === Métricas ===
  const total = logs.length;

  const porValidador = logs.reduce(
    (acc, log) => {
      acc[log.validador] = (acc[log.validador] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const porResultado = logs.reduce(
    (acc, log) => {
      acc[log.resultado] = (acc[log.resultado] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const pieData = Object.entries(porResultado).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ["#22c55e", "#ef4444", "#f97316", "#3b82f6"];

  const ultimosLogs = logs.slice(0, 80); // ya vienen ordenados desc en el endpoint

  // Helper para badge de resultado
  function resultadoBadge(resultado: string) {
    const r = resultado.toUpperCase();
    let cls =
      "inline-flex px-3 py-1 rounded-full text-[11px] font-semibold text-white";
    if (r.includes("VALIDADO")) cls += " bg-emerald-600";
    else if (r.includes("YA")) cls += " bg-rose-600";
    else if (r.includes("NO")) cls += " bg-amber-500 text-zinc-900";
    else cls += " bg-sky-600";

    return <span className={cls}>{resultado}</span>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-slate-950 text-slate-50 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25)_0,_transparent_45%),radial-gradient(circle_at_bottom,_rgba(147,51,234,0.25)_0,_transparent_45%)]" />

      <div className="relative z-10 px-4 md:px-6 lg:px-10 py-6 space-y-6">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-zinc-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Core Sync • Validaciones
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Dashboard de validaciones
              </h1>
              <p className="text-xs md:text-sm text-zinc-400 mt-1">
                Seguimiento de escaneos, desempeño por validador y resultados en
                puerta.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-zinc-700/80 bg-zinc-900/70 hover:bg-zinc-800/80 transition cursor-pointer"
              onClick={() => router.push("/admin")}
            >
              ← Volver al panel
            </button>
            <button
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-rose-500/40 bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-110 shadow-sm shadow-rose-500/40 transition cursor-pointer"
              onClick={async () => {
                await fetch("/api/admin-logout", { method: "POST" });
                router.push("/admin");
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* STATS */}
        {!loading && (
          <section className="flex flex-wrap gap-3">
            <StatCard
              label="Total escaneos"
              value={total}
              color="from-sky-500 to-indigo-500"
              subtitle="Todos los resultados"
            />
            {Object.entries(porResultado).map(([res, count], idx) => (
              <StatCard
                key={res}
                label={res}
                value={count}
                color={
                  idx === 0
                    ? "from-emerald-500 to-green-600"
                    : idx === 1
                    ? "from-rose-500 to-red-600"
                    : "from-amber-400 to-orange-500"
                }
              />
            ))}
            {Object.entries(porValidador).map(([val, count]) => (
              <StatCard
                key={val}
                label={`Validador: ${val}`}
                value={count}
                color="from-fuchsia-500 to-purple-600"
              />
            ))}
          </section>
        )}

        {/* CHART */}
        {!loading && pieData.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-zinc-950/85 backdrop-blur-xl px-4 md:px-6 py-5 shadow-xl">
            <h2 className="text-sm md:text-base font-semibold mb-2 tracking-wide flex items-center gap-2">
              <span className="inline-block w-1.5 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-sky-500" />
              Distribución por resultado
            </h2>
            <div className="w-full">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    paddingAngle={2}
                    label={({ name, percent }) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* TABLA */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg
              className="animate-spin h-9 w-9 text-sky-400 mb-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <p className="text-xs text-zinc-400">Cargando logs…</p>
          </div>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide">
                Últimos tickets escaneados
              </h2>
              <span className="text-[11px] text-zinc-500">
                {ultimosLogs.length} registro(s) recientes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-zinc-900/90">
                    <th className="px-3 py-2 border-b border-zinc-800 text-left font-semibold text-[11px] uppercase tracking-wide text-zinc-400">
                      Fecha
                    </th>
                    <th className="px-3 py-2 border-b border-zinc-800 text-left font-semibold text-[11px] uppercase tracking-wide text-zinc-400">
                      Código
                    </th>
                    <th className="px-3 py-2 border-b border-zinc-800 text-left font-semibold text-[11px] uppercase tracking-wide text-zinc-400">
                      Nombre
                    </th>
                    <th className="px-3 py-2 border-b border-zinc-800 text-left font-semibold text-[11px] uppercase tracking-wide text-zinc-400">
                      Validador
                    </th>
                    <th className="px-3 py-2 border-b border-zinc-800 text-left font-semibold text-[11px] uppercase tracking-wide text-zinc-400">
                      Resultado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosLogs.map((log, i) => (
                    <tr
                      key={i}
                      className="hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-3 py-2 border-b border-zinc-900 text-zinc-300">
                        {log.fecha}
                      </td>
                      <td className="px-3 py-2 border-b border-zinc-900 font-mono text-[11px] text-zinc-200">
                        {log.codigo}
                      </td>
                      <td className="px-3 py-2 border-b border-zinc-900 text-zinc-200 max-w-xs truncate">
                        {log.nombre}
                      </td>
                      <td className="px-3 py-2 border-b border-zinc-900 text-zinc-300">
                        {log.validador}
                      </td>
                      <td className="px-3 py-2 border-b border-zinc-900">
                        {resultadoBadge(log.resultado)}
                      </td>
                    </tr>
                  ))}
                  {ultimosLogs.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-sm text-zinc-500"
                      >
                        Aún no hay escaneos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}