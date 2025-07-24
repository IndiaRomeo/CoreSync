// admin/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

export default function Dashboard() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin-login")
      .then(res => setIsAuth(res.ok))
      .catch(() => setIsAuth(false));
  }, []);

  useEffect(() => {
    fetch("/api/logs")
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setLoading(false);
      });
  }, []);

    // Mostrar pantalla restringida si no está autenticado
  if (isAuth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white text-xl">
        Cargando...
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white text-xl">
        Acceso restringido. <br />
        Debes iniciar sesión como administrador para registrar compradores.
      </div>
    );
  }

  const total = logs.length;
  const porValidador = logs.reduce((acc, log) => {
    acc[log.validador] = (acc[log.validador] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const porResultado = logs.reduce((acc, log) => {
    acc[log.resultado] = (acc[log.resultado] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(porResultado).map(([k, v]) => ({ name: k, value: v }));
  const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6"];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Dashboard de Validaciones</h1>
      <button
        className="mt-4 bg-red-600 px-4 py-2 rounded text-white hover:bg-red-700"
        onClick={async () => {
          await fetch("/api/logout", { method: "POST" });
          setIsAuth(false);
        }}
      >
        Cerrar sesión
      </button>

      {loading ? (
        <div className="text-center py-10">Cargando datos...</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-xl shadow w-full md:w-auto">
              <div className="text-white text-xl font-bold">Total escaneos</div>
              <div className="text-3xl font-extrabold text-blue-400">{total}</div>
            </div>
            {Object.entries(porValidador).map(([val, count]) => (
              <div key={val} className="bg-gray-800 p-4 rounded-xl shadow w-full md:w-auto">
                <div className="text-white text-sm font-bold">{val}</div>
                <div className="text-2xl font-extrabold text-green-400">{count}</div>
              </div>
            ))}
          </div>

          <div className="my-6">
            <h2 className="text-xl font-bold mb-2">Distribución por resultado</h2>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto mt-8">
            <h2 className="text-xl font-bold mb-2">Últimos tickets escaneados</h2>
            <table className="min-w-full text-sm border border-gray-700 bg-gray-900">
              <thead>
                <tr className="bg-gray-800">
                  <th className="p-2 border-b border-gray-700 text-left">Fecha</th>
                  <th className="p-2 border-b border-gray-700 text-left">Código</th>
                  <th className="p-2 border-b border-gray-700 text-left">Nombre</th>
                  <th className="p-2 border-b border-gray-700 text-left">Validador</th>
                  <th className="p-2 border-b border-gray-700 text-left">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(-30).reverse().map((log, i) => (
                  <tr key={i} className="hover:bg-gray-700/60">
                    <td className="p-2 border-b border-gray-800">{log.fecha}</td>
                    <td className="p-2 border-b border-gray-800">{log.codigo}</td>
                    <td className="p-2 border-b border-gray-800">{log.nombre}</td>
                    <td className="p-2 border-b border-gray-800">{log.validador}</td>
                    <td className="p-2 border-b border-gray-800">{log.resultado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}