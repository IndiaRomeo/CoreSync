"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

// Componente simple de alerta
function AlertBar({ msg, type = "info", onClose }: { msg: string; type: string; onClose: () => void }) {
  const bg = type === "success" ? "bg-green-600"
           : type === "error" ? "bg-red-600"
           : "bg-blue-600";
  return (
    <div className={`fixed top-5 left-1/2 z-[200] -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg text-white font-bold ${bg} animate-fade-in-up`}>
      {msg}
      <button className="ml-4 text-white/80 hover:text-white" onClick={onClose}>×</button>
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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex flex-col items-center p-3 rounded-xl min-w-[90px] shadow-md ${color}`}>
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-xs font-semibold text-white/80">{label}</span>
    </div>
  );
}

function exportToCsv(tickets: Ticket[]) {
  if (!tickets.length) return;
  const headers = Object.keys(tickets[0]);
  const rows = tickets.map(t =>
    headers.map(h => {
      let cell = t[h] ?? "";
      // Escapar comillas y saltos de línea
      cell = String(cell).replace(/"/g, '""').replace(/\n/g, " ");
      return `"${cell}"`;
    }).join(",")
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
  // TODOS LOS HOOKS PRIMERO
  // 1. Login
  const [isAuth, setIsAuth] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  // 2. Panel admin
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState<string | null>(null);
  const [filter, setFilter] = useState(""); // para búsqueda rápida
  const [showHelp, setShowHelp] = useState(false);
  const [alert, setAlert] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  // 2. Al cargar, revisa si la cookie de login está presente
  useEffect(() => {
    fetch("/api/admin-login")
      .then(res => setIsAuth(res.ok))
      .finally(() => setCheckingAuth(false));
  }, []);

  useEffect(() => {
    actualizarTickets();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 2000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  // 3. Formulario login (solo visible si !isAuth)
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

  if (checkingAuth) return null;
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-gray-900 rounded-xl p-8 shadow-xl flex flex-col gap-4 w-full max-w-xs">
          <h2 className="text-lg font-bold text-white">Acceso restringido</h2>
          <input
            type="password"
            placeholder="Contraseña admin"
            className="p-2 rounded bg-gray-800 text-white border border-gray-700"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
          />
          <button className="bg-blue-700 rounded py-2 font-bold text-white">Ingresar</button>
          {loginError && <div className="text-red-400 text-xs">{loginError}</div>}
        </form>
      </div>
    );
  }

  // Stats
  const total = tickets.length;
  const pagadas = tickets.filter(t => (t.Estado || "").toLowerCase() === "pagado").length;
  const reservadas = tickets.filter(t => (t.Estado || "").toLowerCase() === "reservado").length;
  const usados = tickets.filter(t => ((t["Qr usado"] || t.Usado || "").toLowerCase() === "si")).length;
  const sinUsar = total - usados;
  const ultimo = tickets.length ? tickets[tickets.length - 1] : null;
  const pagadasNoUsadas = pagadas - usados;

  const pieData = [
    { name: "Asistieron (pagado y usado)", value: usados },
    { name: "Pagó pero no asistió", value: pagadasNoUsadas },
    { name: "Reservadas (no pagado)", value: reservadas },
  ];

  // Colores personalizados
  const COLORS = ["#10b981", "#3b82f6", "#eab308"]; // verde, azul, amarillo

  function actualizarTickets() {
    setLoading(true);
    fetch("/api/tickets")
      .then(res => res.json())
      .then(data => {
        setTickets(data.tickets || []);
        setLoading(false);
      });
  }

  // Filtro/búsqueda simple (por nombre, email o código)
  const filteredTickets = tickets.filter(t =>
    !filter ||
    (t.Nombre && t.Nombre.toLowerCase().includes(filter.toLowerCase())) ||
    (t.Email && t.Email.toLowerCase().includes(filter.toLowerCase())) ||
    (t.Código && t.Código.toLowerCase().includes(filter.toLowerCase()))
  );

  // Mobile tabla scroll-x, cabeceras sticky
  return (
    <div className="p-6 min-h-screen bg-black text-white">
      {alert && (
        <AlertBar
          msg={alert.msg}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      {/* Header + Menú de ayuda */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap mb-3 gap-2">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Panel Admin - Boletas</h1>
          <button
            className="bg-gray-800 text-xs rounded px-3 py-1 border border-gray-600 hover:bg-blue-800 transition cursor-pointer"
            onClick={() => setShowHelp(true)}
          >¿Cómo usar?</button>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            placeholder="Buscar por nombre, email o código..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:border-blue-400 outline-none"
          />
          <button
            className="bg-green-700 px-3 py-1 rounded font-bold text-xs hover:bg-green-800 transition cursor-pointer"
            onClick={() => exportToCsv(filteredTickets)}
          >
            Descargar CSV
          </button>
          <button
            className="bg-blue-700 px-3 py-1 rounded font-bold text-xs hover:bg-blue-900 transition cursor-pointer"
            onClick={actualizarTickets}
            disabled={loading}
            title="Actualizar lista de boletas"
          >
            {loading ? "Actualizando..." : "Actualizar lista"}
          </button>
          {/* === Botón de backup === 
          <button
            className="bg-blue-700 px-3 py-1 rounded font-bold text-xs hover:bg-blue-800 transition cursor-pointer"
            onClick={() => {
              window.open('/api/backup', '_blank');
            }}
          >
            Descargar backup completo
          </button>*/}
        </div>
      </div>

      {/* Stats cards */}
      {!loading && (
        <div className="flex flex-wrap gap-3 mb-4">
          <StatCard label="Total boletas" value={total} color="bg-blue-800" />
          <StatCard label="Pagadas" value={pagadas} color="bg-green-700" />
          <StatCard label="Reservadas" value={reservadas} color="bg-yellow-700" />
          <StatCard label="QR usados" value={usados} color="bg-purple-700" />
          <StatCard label="Sin usar" value={sinUsar} color="bg-gray-700" />
        </div>
      )}

      {/* Pie Chart de análisis */}
      {!loading && (
        <div className="w-full flex flex-col items-center my-10">
          <div className="text-center text-2xl font-bold mb-4 tracking-wide">
            Análisis general de asistencia
          </div>
          <div className="flex justify-center w-full">
            <ResponsiveContainer width={750} height={430}>
              <PieChart width={600} height={430}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={110} // un poco más grande para aprovechar el alto
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
        </div>
      )}


      {/* Último ticket creado */}
      {!loading && ultimo && (
        <div className="text-xs mb-4 bg-gray-900/80 px-3 py-2 rounded-xl border border-gray-700">
          <b>Última boleta:</b> #{ultimo.Código} · {ultimo.Nombre} · {ultimo.Email}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-10">
            <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
        </div>
        )}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-700 text-xs md:text-sm bg-gray-900/90 shadow-lg rounded-xl">
            <thead className="sticky top-0 z-10">
              <tr>
                {tickets[0] &&
                  Object.keys(tickets[0]).map(key => (
                    <th key={key} className="border-b border-gray-700 px-2 py-2 text-left font-bold bg-gray-800">
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t, i) => (
                <tr
                  key={i}
                  className={
                    ((t["Qr usado"] || t.Usado || "").toLowerCase() === "si")
                      ? "bg-green-900/60 hover:bg-green-800/70"
                      : "hover:bg-gray-700/40"
                  }
                >
                  {Object.entries(t).map(([k, v], j) =>
                    k.toLowerCase() === "estado" ? (
                    <td key={j} className="border-b border-gray-800 px-2 py-2">
                      <span className={
                        String(v).toLowerCase() === "pagado"
                          ? "inline-block px-3 py-1 rounded-full bg-green-600 text-white font-bold"
                          : String(v).toLowerCase() === "reservado"
                          ? "inline-block px-3 py-1 rounded-full bg-yellow-600 text-white font-bold"
                          : "inline-block px-3 py-1 rounded-full bg-gray-500 text-white"
                      }>
                        {v}
                      </span>
                      {String(v).toLowerCase() === "reservado" && (
                        <button
                          className="ml-2 px-2 py-1 bg-green-700 rounded text-xs font-bold text-white hover:bg-green-900 cursor-pointer"
                          onClick={async () => {
                            if (!window.confirm("¿Marcar este ticket como PAGADO?")) return;
                            const resp = await fetch("/api/marcar-pago", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ codigo: t.Código || t.codigo }),
                            });
                            if (resp.ok) {
                              setAlert({ msg: "¡Boleta marcada como pagada!", type: "success" });
                              setTickets(tickets => tickets.map(ticket =>
                                ticket.Código === t.Código ? { ...ticket, Estado: "Pagado" } : ticket
                              ));
                            } else {
                              setAlert({ msg: "Error al marcar como pagada", type: "error" });
                            }
                          }}
                        >
                          Marcar pagado
                        </button>
                      )}
                    </td>
                  ) : k.toLowerCase() === "qr" ? (
                      <td key={j} className="border-b border-gray-800 px-2 py-2">
                        <button
                          onClick={() => setShowQr(v as string)}
                          className="text-blue-300 underline hover:text-blue-500 transition cursor-pointer"
                        >
                          Ver QR
                        </button>
                        {/*<a
                          href={`/api/boleta-pdf?codigo=${encodeURIComponent(t.Código || t.codigo || "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-300 underline hover:text-purple-500 transition cursor-pointer ml-3"
                          download={`ticket_${t.Código || t.codigo}.pdf`}
                        >
                          Descargar Ticket
                        </a>*/}
                      </td>
                    ) : k.toLowerCase() === "qr usado" ? (
                      <td key={j} className="border-b border-gray-800 px-2 py-2 text-center">
                        <span className={
                          (v === "SI" || v === "si")
                            ? "inline-block px-3 py-1 rounded-full bg-green-600 text-white font-bold"
                            : "inline-block px-3 py-1 rounded-full bg-gray-500 text-white font-bold"
                        }>
                          {v === "SI" || v === "si" ? "Sí" : "No"}
                        </span>
                      </td>
                    ) : (
                      <td key={j} className="border-b border-gray-800 px-2 py-2 max-w-xs truncate">{v}</td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTickets.length === 0 && (
            <div className="mt-6 text-center text-gray-400">
              No hay resultados para tu búsqueda.
            </div>
          )}
        </div>
      )}

      {/* MODAL QR */}
      {showQr && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
          onClick={() => setShowQr(null)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <img src={showQr} alt="QR" className="w-52 h-52 object-contain" />
            <button
              className="mt-4 px-4 py-2 rounded bg-black text-white font-bold cursor-pointer"
              onClick={() => setShowQr(null)}
            >
              Cerrar
            </button>
            <a
              href={showQr}
              download="qr-ticket.png"
              className="mt-2 text-blue-600 underline cursor-pointer"
            >
              Descargar QR
            </a>
          </div>
        </div>
      )}

      {/* AYUDA / Manual rápido */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl text-black relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-lg px-2 py-1 rounded bg-black/10 hover:bg-black/20" onClick={() => setShowHelp(false)}>×</button>
            <h2 className="text-2xl font-bold mb-2 text-blue-900">¿Cómo usar el panel?</h2>
            <ul className="mb-3 list-disc pl-6 text-sm">
              <li>Filtra por nombre, email o código para ubicar rápido cualquier persona.</li>
              <li>Pulsa <b>“Ver QR”</b> para ver el QR del ticket y descargarlo.</li>
              <li>Las boletas pagadas y usadas tienen color; las reservadas aparecen en amarillo.</li>
              <li>Puedes descargar todas las boletas en CSV para verlas en Excel.</li>
              <li>El panel se actualiza automáticamente al recargar la página.</li>
              <li>Si hay un error o inconsistencia, revisa la hoja de Google Sheets directamente.</li>
            </ul>
            <div className="mt-2 text-xs text-gray-600">Recuerda: solo compartir este link a staff autorizado.<br />Actualiza la página si notas cambios externos en la base.</div>
          </div>
        </div>
      )}
    </div>
  );
}