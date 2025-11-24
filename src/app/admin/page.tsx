"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Componente simple de alerta (toast)
function AlertBar({
  msg,
  type = "info",
  onClose,
}: {
  msg: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  const bg =
    type === "success"
      ? "from-emerald-500 to-emerald-600"
      : type === "error"
      ? "from-rose-500 to-rose-600"
      : "from-sky-500 to-sky-600";

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] flex items-start justify-center mt-6">
      <div
        className={`pointer-events-auto px-6 py-3 rounded-2xl shadow-2xl text-white font-semibold bg-gradient-to-r ${bg} flex items-center gap-4 border border-white/20 backdrop-blur`}
      >
        <span>{msg}</span>
        <button
          className="text-white/70 hover:text-white text-lg leading-none"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  );
}

type Ticket = {
  Código: string;
  Nombre: string;
  Teléfono: string;
  Email: string;
  Estado: string;
  "Qr usado": string;
  Qr?: string;

  [key: string]: string | undefined;
};

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex-1 min-w-[130px]">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 shadow-lg px-4 py-3">
        <div
          className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${color}`}
        />
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold tracking-tight">
              {value}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              {label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function exportToCsv(tickets: Ticket[]) {
  if (!tickets.length) return;
  const headers = Object.keys(tickets[0]);
  const rows = tickets.map((t) =>
    headers
      .map((h) => {
        let cell = t[h] ?? "";
        cell = String(cell).replace(/"/g, '""').replace(/\n/g, " ");
        return `"${cell}"`;
      })
      .join(",")
  );
  const csvContent = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "boletas.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function AdminPanel() {
  // 1. Login
  const [isAuth, setIsAuth] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // 2. Panel admin
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [alert, setAlert] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [statusFilter, setStatusFilter] = useState<
  "todos" | "pagado" | "reservado" | "rechazado"
  >("todos");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // claves que no queremos mostrar como columnas
  const HIDDEN_KEYS = new Set(["Fecha compra ISO"]);

  // Revisa cookie admin
  useEffect(() => {
    fetch("/api/admin-login")
      .then((res) => setIsAuth(res.ok))
      .finally(() => setCheckingAuth(false));
  }, []);

  useEffect(() => {
    actualizarTickets();
  }, []);

  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 2000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin-login", {
      method: "POST",
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      setIsAuth(true);
      setPassword("");
    } else {
      setLoginError("Clave incorrecta");
    }
  }

  async function handleResend(ticket: Ticket) {
    try {
      if (!ticket.Código) {
        setAlert({ msg: "Ticket sin código", type: "error" });
        return;
      }

      const resp = await fetch("/api/resend-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: ticket.Código }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        console.error("❌ Error reenviando ticket:", data);
        setAlert({
          msg: data.error || "No se pudo reenviar el ticket",
          type: "error",
        });
        return;
      }

      setAlert({ msg: "Ticket reenviado por email ✅", type: "success" });
    } catch (e) {
      console.error("❌ Error en handleResend:", e);
      setAlert({ msg: "Error interno reenviando ticket", type: "error" });
    }
  }

  async function handleMarkQrUsed(ticket: Ticket) {
    try {
      if (!ticket.Código) {
        setAlert({ msg: "Ticket sin código", type: "error" });
        return;
      }

      if (!window.confirm("¿Marcar este QR como usado manualmente?")) return;

      const resp = await fetch("/api/marcar-qr-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: ticket.Código, validador: "ADMIN_PANEL" }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data.ok) {
        console.error("❌ Error marcando QR manual:", data);
        setAlert({
          msg: data.error || "No se pudo marcar el QR como usado",
          type: "error",
        });
        return;
      }

      // Actualizar estado local
      setTickets((tickets) =>
        tickets.map((t) =>
          t.Código === ticket.Código ? { ...t, "Qr usado": "SI" } : t
        )
      );

      setAlert({ msg: "QR marcado como usado ✅", type: "success" });
    } catch (e) {
      console.error("❌ Error en handleMarkQrUsed:", e);
      setAlert({ msg: "Error interno marcando QR", type: "error" });
    }
  }

  if (checkingAuth) return null;

  // ====== LOGIN VIEW ======
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-slate-950 flex items-center justify-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_#22d3ee_0,_transparent_45%),radial-gradient(circle_at_bottom,_#8b5cf6_0,_transparent_45%)]" />
        <form
          onSubmit={handleLogin}
          className="relative bg-zinc-950/90 border border-white/10 rounded-3xl px-8 py-7 shadow-2xl flex flex-col gap-4 w-full max-w-sm backdrop-blur-xl"
        >
          <div className="flex flex-col gap-1 mb-1">
            <span className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Core Sync • Admin
            </span>
            <h2 className="text-xl font-bold text-white">
              Acceso al panel de boletas
            </h2>
            <p className="text-xs text-zinc-400">
              Ingresa la clave interna para ver ventas, asistentes y validaciones.
            </p>
          </div>
          <input
            type="password"
            placeholder="Contraseña admin"
            className="p-2.5 rounded-xl bg-zinc-900 text-white border border-zinc-700/80 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button className="mt-1 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-xl py-2.5 font-semibold text-sm text-white shadow-lg shadow-sky-500/30 hover:shadow-indigo-500/40 hover:translate-y-[1px] transition">
            Ingresar
          </button>
          {loginError && (
            <div className="text-rose-400 text-xs mt-1">{loginError}</div>
          )}
          <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Solo para uso interno de staff autorizado.
          </div>
        </form>
      </div>
    );
  }

  // ====== STATS ======
  const total = tickets.length;
  const pagadas = tickets.filter(
    (t) => (t.Estado || "").toLowerCase() === "pagado"
  ).length;
  const reservadas = tickets.filter(
    (t) => (t.Estado || "").toLowerCase() === "reservado"
  ).length;
  const usados = tickets.filter(
    (t) => (t["Qr usado"] || "").toLowerCase() === "si"
  ).length;
  const sinUsar = total - usados;
  const ultimo = tickets.length ? tickets[tickets.length - 1] : null;
  const pagadasNoUsadas = pagadas - usados;

  const pieData = [
    { name: "Asistieron (pagado y usado)", value: usados },
    { name: "Pagó pero no asistió", value: pagadasNoUsadas },
    { name: "Reservadas (no pagado)", value: reservadas },
  ];

  const COLORS = ["#10b981", "#3b82f6", "#eab308"];

  function actualizarTickets() {
    setLoading(true);
    fetch("/api/tickets")
      .then((res) => res.json())
      .then((data) => {
        setTickets(data.tickets || []);
        setLoading(false);
      });
  }

  const filteredTickets = tickets.filter((t) => {
    // 1) Filtro de texto
    const textOk =
      !filter ||
      (t.Nombre &&
        t.Nombre.toLowerCase().includes(filter.toLowerCase())) ||
      (t.Email && t.Email.toLowerCase().includes(filter.toLowerCase())) ||
      (t.Código && t.Código.toLowerCase().includes(filter.toLowerCase()));

    if (!textOk) return false;

    // 2) Filtro de estado
    if (statusFilter !== "todos") {
      const estado = (t.Estado || "").toLowerCase();
      if (estado !== statusFilter) return false;
    }

    // 3) Filtro por fecha (usamos "Fecha compra ISO" del backend)
    const iso = t["Fecha compra ISO"];
    if (iso) {
      const compraDate = new Date(iso);

      if (dateFrom) {
        const fromDate = new Date(dateFrom + "T00:00:00");
        if (compraDate < fromDate) return false;
      }

      if (dateTo) {
        const toDate = new Date(dateTo + "T23:59:59");
        if (compraDate > toDate) return false;
      }
    }

    return true;
  });

  // ====== MAIN ADMIN VIEW ======
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-slate-950 text-slate-50 relative overflow-hidden">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25)_0,_transparent_45%),radial-gradient(circle_at_bottom,_rgba(147,51,234,0.25)_0,_transparent_45%)]" />

      <div className="relative z-10 px-4 md:px-6 lg:px-10 py-6 space-y-6">
        {alert && (
          <AlertBar
            msg={alert.msg}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-zinc-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Core Sync • Ticketing
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Panel Admin – Boletas
              </h1>
              <p className="text-xs md:text-sm text-zinc-400 mt-1">
                Control de ventas, asistentes, validaciones y generación de
                reportes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-zinc-700/80 bg-zinc-900/70 hover:bg-zinc-800/80 transition cursor-pointer"
              onClick={() => setShowHelp(true)}
            >
              ¿Cómo usar?
            </button>
            <button
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-sky-500/40 bg-sky-600/80 hover:bg-sky-500/90 shadow-sm shadow-sky-500/40 transition cursor-pointer"
              onClick={() => (window.location.href = "/admin/dashboard")}
            >
              Ver logs de validación
            </button>
            <button
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-rose-500/40 bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-110 shadow-sm shadow-rose-500/40 transition cursor-pointer"
              onClick={async () => {
                await fetch("/api/admin-logout", { method: "POST" });
                window.location.reload();
              }}
              title="Cerrar sesión"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* SEARCH + ACTIONS */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl px-4 py-3 flex flex-wrap gap-3 items-center shadow-lg">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
                Buscar boletas
              </span>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <input
                placeholder="Nombre, email o código..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
              />
              <div className="flex flex-wrap gap-2 items-center flex-1 min-w-[220px]">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as "todos" | "pagado" | "reservado" | "rechazado")
                  }
                  className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-[11px] text-zinc-200"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pagado">Solo pagadas</option>
                  <option value="reservado">Solo reservadas</option>
                  <option value="rechazado">Solo rechazadas</option>
                </select>

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-2 py-1.5 text-[11px] text-zinc-200"
                />

                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-2 py-1.5 text-[11px] text-zinc-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="bg-emerald-600/90 hover:bg-emerald-500 text-[11px] px-3 py-1.5 rounded-xl font-semibold shadow-sm shadow-emerald-500/40 cursor-pointer"
                onClick={() => exportToCsv(filteredTickets)}
              >
                Descargar CSV
              </button>
              <button
                className="bg-sky-600/90 hover:bg-sky-500 text-[11px] px-3 py-1.5 rounded-xl font-semibold shadow-sm shadow-sky-500/40 cursor-pointer disabled:opacity-60"
                onClick={actualizarTickets}
                disabled={loading}
                title="Actualizar lista de boletas"
              >
                {loading ? "Actualizando..." : "Actualizar lista"}
              </button>
            </div>
          </div>

          {/* RESUMEN RÁPIDO */}
          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl px-4 py-3 shadow-lg flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Resumen rápido
            </span>
            <p className="text-xs text-zinc-400 leading-snug">
              {total === 0 ? (
                <>Aún no hay boletas registradas para este evento.</>
              ) : (
                <>
                  Tienes <b>{total}</b> boleta(s) en total, de las cuales{" "}
                  <b>{pagadas}</b> están <span className="text-emerald-400">pagadas</span> y{" "}
                  <b>{reservadas}</b> siguen{" "}
                  <span className="text-amber-300">reservadas</span>. Se han
                  usado <b>{usados}</b> QR en puerta.
                </>
              )}
            </p>
          </div>
        </section>

        {/* STATS CARDS */}
        {!loading && (
          <section className="flex flex-wrap gap-3">
            <StatCard label="Total boletas" value={total} color="from-sky-500 to-indigo-500" />
            <StatCard label="Pagadas" value={pagadas} color="from-emerald-500 to-green-600" />
            <StatCard label="Reservadas" value={reservadas} color="from-amber-400 to-orange-500" />
            <StatCard label="QR usados" value={usados} color="from-fuchsia-500 to-purple-600" />
            <StatCard label="Sin usar" value={sinUsar} color="from-zinc-500 to-slate-500" />
          </section>
        )}

        {/* CHART + LAST TICKET */}
        {!loading && (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl px-4 md:px-6 py-5 shadow-xl">
              <h2 className="text-sm md:text-base font-semibold mb-2 tracking-wide flex items-center gap-2">
                <span className="inline-block w-1.5 h-6 rounded-full bg-gradient-to-b from-sky-400 to-indigo-500" />
                Análisis general de asistencia
              </h2>
              <div className="w-full">
                <ResponsiveContainer
                  width="100%"
                  height={typeof window !== "undefined" && window.innerWidth < 640 ? 250 : 320}
                >
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={
                        typeof window !== "undefined" && window.innerWidth < 640 ? 80 : 110
                      }
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] mt-2 justify-center text-zinc-400">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Asistieron (pagado y usado)
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Pagó pero no asistió
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Reservadas (no pagado)
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {ultimo && (
                <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-emerald-400/10 px-4 py-3 shadow-lg">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-emerald-300 mb-1">
                    Última boleta registrada
                  </div>
                  <div className="text-xs text-zinc-200">
                    <b>#{ultimo.Código}</b> · {ultimo.Nombre} · {ultimo.Email}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-[11px] text-zinc-400 backdrop-blur-xl shadow-lg">
                <p>
                  Tip: puedes abrir este panel desde el celular el día del evento
                  para buscar por nombre o correo y verificar pagos al vuelo.
                </p>
              </div>
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
            <p className="text-xs text-zinc-400">Cargando boletas…</p>
          </div>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide">
                Listado de boletas
              </h2>
              <span className="text-[11px] text-zinc-500">
                {filteredTickets.length} resultado(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-zinc-900/90">
                    {tickets[0] &&
                    Object.keys(tickets[0])
                      .filter((key) => !HIDDEN_KEYS.has(key))
                      .map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 border-b border-zinc-800 text-left font-semibold text-[11px] uppercase tracking-wide text-zinc-400"
                        >
                          {key}
                        </th>
                      ))}
                    {/* Columna fija de acciones */}
                    <th className="px-3 py-2 border-b border-zinc-800 text-left font-semibold text-[11px] uppercase tracking-wide text-zinc-400">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((t, i) => (
                    <tr
                      key={i}
                      className={
                        (t["Qr usado"] || "").toLowerCase() === "si"
                          ? "bg-emerald-900/30 hover:bg-emerald-800/40"
                          : "hover:bg-zinc-800/40"
                      }
                    >
                      {Object.entries(t)
                      .filter(([k]) => !HIDDEN_KEYS.has(k))
                      .map(([k, v], j) =>
                        k.toLowerCase() === "estado" ? (
                          <td
                            key={j}
                            className="border-b border-zinc-900 px-3 py-2 align-middle"
                          >
                            <span
                              className={
                                String(v).toLowerCase() === "pagado"
                                  ? "inline-flex px-3 py-1 rounded-full bg-emerald-600 text-[11px] font-semibold text-white"
                                  : String(v).toLowerCase() === "reservado"
                                  ? "inline-flex px-3 py-1 rounded-full bg-amber-500 text-[11px] font-semibold text-zinc-900"
                                  : "inline-flex px-3 py-1 rounded-full bg-zinc-600 text-[11px] font-semibold text-white"
                              }
                            >
                              {v}
                            </span>
                            {String(v).toLowerCase() === "reservado" && (
                              <button
                                className="ml-2 px-2 py-1 rounded-full bg-emerald-700 text-[10px] font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                                onClick={async () => {
                                  if (
                                    !window.confirm(
                                      "¿Marcar este ticket como PAGADO?"
                                    )
                                  )
                                    return;
                                  const resp = await fetch("/api/marcar-pago", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      codigo: t.Código,
                                    }),
                                  });
                                  if (resp.ok) {
                                    setAlert({
                                      msg: "¡Boleta marcada como pagada!",
                                      type: "success",
                                    });
                                    setTickets((tickets) =>
                                      tickets.map((ticket) =>
                                        ticket.Código === t.Código
                                          ? { ...ticket, Estado: "Pagado" }
                                          : ticket
                                      )
                                    );
                                  } else {
                                    setAlert({
                                      msg: "Error al marcar como pagada",
                                      type: "error",
                                    });
                                  }
                                }}
                              >
                                Marcar pagado
                              </button>
                            )}
                          </td>
                        ) : k.toLowerCase() === "qr" ? (
                          <td
                            key={j}
                            className="border-b border-zinc-900 px-3 py-2"
                          >
                            <button
                              onClick={() => setShowQr(v as string)}
                              className="text-sky-300 text-[11px] underline hover:text-sky-400 transition cursor-pointer"
                            >
                              Ver QR
                            </button>
                          </td>
                        ) : k.toLowerCase() === "qr usado" ? (
                          <td
                            key={j}
                            className="border-b border-zinc-900 px-3 py-2 text-center"
                          >
                            <span
                              className={
                                v === "SI" || v === "si"
                                  ? "inline-flex px-3 py-1 rounded-full bg-emerald-600 text-[11px] font-semibold text-white"
                                  : "inline-flex px-3 py-1 rounded-full bg-zinc-600 text-[11px] font-semibold text-white"
                              }
                            >
                              {v === "SI" || v === "si" ? "Sí" : "No"}
                            </span>
                          </td>
                        ) : (
                          <td
                            key={j}
                            className="border-b border-zinc-900 px-3 py-2 max-w-xs truncate text-xs text-zinc-200"
                          >
                            {v}
                          </td>
                        )
                      )}
                      <td className="border-b border-zinc-900 px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="px-2.5 py-1 rounded-full bg-sky-600 text-[10px] font-semibold text-white hover:bg-sky-500 cursor-pointer"
                            onClick={() => handleResend(t)}
                          >
                            Reenviar ticket
                          </button>

                          {(t["Qr usado"] || "").toLowerCase() !== "si" && (
                            <button
                              className="px-2.5 py-1 rounded-full bg-emerald-700 text-[10px] font-semibold text-white hover:bg-emerald-600 cursor-pointer"
                              onClick={() => handleMarkQrUsed(t)}
                            >
                              Marcar QR usado
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTickets.length === 0 && (
              <div className="py-8 text-center text-sm text-zinc-500">
                No hay resultados para tu búsqueda.
              </div>
            )}
          </section>
        )}

        {/* MODAL QR */}
        {showQr && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4"
            onClick={() => setShowQr(null)}
          >
            <div
              className="bg-zinc-950 rounded-2xl shadow-2xl border border-white/10 px-6 py-6 flex flex-col items-center max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold mb-3">
                QR de la boleta
              </h3>
              <Image
                src={showQr}
                alt="QR de la boleta"
                width={208}
                height={208}
                className="w-52 h-52 object-contain rounded-lg border border-zinc-800 bg-zinc-900"
              />
              <button
                className="mt-4 px-4 py-2 rounded-xl bg-zinc-900 text-sm text-white font-semibold border border-zinc-700 hover:bg-zinc-800 cursor-pointer"
                onClick={() => setShowQr(null)}
              >
                Cerrar
              </button>
              <a
                href={showQr}
                download="qr-ticket.png"
                className="mt-2 text-xs text-sky-400 underline cursor-pointer"
              >
                Descargar QR
              </a>
            </div>
          </div>
        )}

        {/* AYUDA / Manual rápido */}
        {showHelp && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4"
            onClick={() => setShowHelp(false)}
          >
            <div
              className="bg-zinc-50 rounded-2xl p-7 max-w-lg w-full shadow-2xl text-zinc-900 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 text-lg px-2 py-1 rounded-full bg-black/5 hover:bg-black/10"
                onClick={() => setShowHelp(false)}
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-2 text-sky-900">
                ¿Cómo usar el panel?
              </h2>
              <ul className="mb-3 list-disc pl-5 text-sm space-y-1.5">
                <li>
                  Usa el buscador para encontrar rápido por{" "}
                  <b>nombre, email o código</b>.
                </li>
                <li>
                  Pulsa <b>“Ver QR”</b> para mostrar el código en puerta o
                  descargarlo.
                </li>
                <li>
                  El color de cada fila indica si el <b>QR ya fue usado</b>.
                </li>
                <li>
                  Desde la columna <b>Estado</b> puedes marcar una reserva como
                  pagada.
                </li>
                <li>
                  Descarga el <b>CSV</b> para revisar datos en Excel o hacer
                  informes.
                </li>
                <li>
                  Si ves algo raro, revisa la tabla <b>entradas</b> directamente
                  en Supabase.
                </li>
              </ul>
              <div className="mt-2 text-xs text-zinc-500">
                Recuerda: este panel es solo para staff autorizado de Core Sync.
                No compartas la clave de acceso con asistentes.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}