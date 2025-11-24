"use client";

import { useState, useEffect } from "react";
import SnowParticles from "../components/SnowParticles";
import confetti from "canvas-confetti";

type BuyerData = {
  nombre: string;
  telefono: string;
  email: string;
  codigo?: string;
  qrBase64?: string;
  entradaId?: string;
  pdfUrl?: string;
};

function lanzarConfetti() {
  confetti({
    particleCount: 110,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#22c55e", "#0ea5e9", "#ffffff"],
  });
}

function ModalMsg({
  msg,
  type,
  onClose,
  onDownloadPdf,
}: {
  msg: string;
  type: "success" | "error" | "warning";
  onClose: () => void;
  onDownloadPdf?: () => void;
}) {
  const base =
    "fixed inset-0 flex items-center justify-center z-[150] bg-black/60";
  const color =
    type === "success"
      ? "bg-emerald-600/95 border-emerald-300"
      : type === "error"
      ? "bg-rose-700/95 border-rose-300"
      : "bg-amber-600/95 border-amber-300";

  return (
    <div className={base} onClick={onClose}>
      <div
        className={`relative rounded-2xl px-7 pt-9 pb-6 border shadow-2xl text-sm max-w-sm w-full text-center text-white ${color}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/30 hover:bg-black/60 transition cursor-pointer text-lg leading-none"
          onClick={onClose}
        >
          ×
        </button>
        <p className="whitespace-pre-line">{msg}</p>

        {type === "success" && onDownloadPdf && (
          <button
            className="mt-5 w-full px-4 py-2 rounded-xl bg-black/70 hover:bg-black text-sm font-semibold tracking-wide cursor-pointer"
            onClick={onDownloadPdf}
          >
            Descargar ticket
          </button>
        )}
      </div>
    </div>
  );
}

export default function RegistrarForm() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const [modalType, setModalType] = useState<
    "success" | "error" | "warning"
  >("success");
  const [buyerData, setBuyerData] = useState<BuyerData | null>(null);

  useEffect(() => {
    fetch("/api/admin-login")
      .then((res) => setIsAuth(res.ok))
      .catch(() => setIsAuth(false));
  }, []);

  // Cierre automático para error/warning
  useEffect(() => {
    if (modalMsg && modalType !== "success") {
      const t = setTimeout(() => setModalMsg(""), 3000);
      return () => clearTimeout(t);
    }
  }, [modalMsg, modalType]);

  function validarCampos(form: HTMLFormElement) {
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ ]{2,50}$/.test(form.nombre.value.trim())) {
      return "El nombre solo debe contener letras y mínimo 2 caracteres.";
    }
    if (!/^[0-9]{8,15}$/.test(form.telefono.value.trim())) {
      return "El teléfono debe ser solo números (8-15 dígitos).";
    }
    if (!/^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/.test(form.email.value.trim())) {
      return "El email no es válido.";
    }
    return null;
  }

  async function handleDownloadPdf() {
    if (!buyerData?.entradaId) return;

    const res = await fetch(
      `/api/boleta-pdf-from-db?id=${encodeURIComponent(buyerData.entradaId)}`
    );
    if (!res.ok) return;

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ticket-${buyerData.codigo || "boleto"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setModalMsg("");
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const error = validarCampos(form);
    if (error) {
      setModalMsg(error);
      setModalType("error");
      setLoading(false);
      return;
    }

    const body = {
      nombre: form.nombre.value.trim(),
      telefono: form.telefono.value.trim(),
      email: form.email.value.trim(),
    };

    const res = await fetch("/api/register-buyer", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    setLoading(false);

    if (res.ok) {
      const result = await res.json();

      lanzarConfetti();
      setModalType("success");
      setModalMsg(
        `¡Registrado con éxito! 🎫\n\nEl ticket se envió a ${body.email} y puedes descargarlo aquí mismo.`
      );

      setBuyerData({
        ...body,
        codigo: result.codigo,
        qrBase64: result.qrBase64,
        entradaId: result.entradaId,
        pdfUrl: result.pdfUrl,
      });

      form.reset();
    } else {
      setModalMsg("Hubo un error. Intenta nuevamente.");
      setModalType("error");
      setBuyerData(null);
    }
  }

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
        Acceso restringido.
        <br />
        Debes iniciar sesión como administrador para registrar compradores.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-slate-950 text-slate-50 relative overflow-hidden px-4 py-8">
      <SnowParticles />

      {modalMsg && (
        <ModalMsg
          msg={modalMsg}
          type={modalType}
          onClose={() => setModalMsg("")}
          onDownloadPdf={
            modalType === "success"
              ? () => {
                  handleDownloadPdf();
                }
              : undefined
          }
        />
      )}

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Encabezado tipo admin */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-zinc-400 mb-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Core Sync • Ticketing
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Registro manual de boletas
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 mt-2 max-w-md">
            Usa este formulario cuando un cliente paga por WhatsApp o en
            efectivo. Se generará un ticket con QR, se enviará automáticamente
            al correo y también podrás descargarlo para enviarlo por WhatsApp.
          </p>
        </div>

        {/* Card del formulario */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-zinc-950/85 backdrop-blur-xl px-5 py-6 shadow-2xl flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Nombre completo
            </label>
            <input
              name="nombre"
              required
              placeholder="Ej: Ana Gómez"
              className="border border-zinc-700/80 bg-black/60 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Teléfono
            </label>
            <input
              name="telefono"
              required
              placeholder="Solo números"
              className="border border-zinc-700/80 bg-black/60 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Correo electrónico
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="cliente@correo.com"
              className="border border-zinc-700/80 bg-black/60 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          <button
            type="submit"
            className={`mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-sm font-semibold text-white py-2.5 px-4 shadow-lg shadow-emerald-500/30 hover:brightness-110 transition cursor-pointer ${
              loading ? "opacity-70 cursor-wait" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrar y enviar ticket"}
          </button>

          <p className="text-[10px] text-zinc-500 mt-1 text-center">
            Solo para uso interno del staff. No compartas este enlace con los
            asistentes.
          </p>
        </form>
      </div>
    </div>
  );
}