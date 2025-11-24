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
    colors: ["#27c721ff", "#1d0e6bff", "#fff"],
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
  const color =
    type === "success"
      ? "bg-green-700 border-green-400 text-white"
      : type === "error"
      ? "bg-red-700 border-red-400 text-white"
      : "bg-yellow-700 border-yellow-400 text-white";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[150]"
      style={{ background: "rgba(0,0,0,0.12)" }}
      onClick={onClose}
    >
      <div
        className={`relative rounded-xl px-7 pt-10 py-5 border-2 shadow-2xl text-lg max-w-sm text-center ${color} animate-fade-in-up max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón X */}
        <button
          className="absolute top-2 right-2 px-2 py-1 rounded bg-black/40 text-white text-lg font-bold hover:bg-black/70 transition cursor-pointer"
          style={{
            lineHeight: "1",
            minWidth: "30px",
            minHeight: "30px",
          }}
          onClick={onClose}
        >
          ×
        </button>

        {msg}

        {type === "success" && onDownloadPdf && (
          <button
            className="mt-6 px-4 py-2 rounded bg-black text-white font-bold hover:bg-blue-700 transition block w-full cursor-pointer"
            onClick={onDownloadPdf}
          >
            Descargar Ticket
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
  const [modalType, setModalType] = useState<"success" | "error" | "warning">(
    "success"
  );
  const [buyerData, setBuyerData] = useState<BuyerData | null>(null);

  useEffect(() => {
    fetch("/api/admin-login")
      .then((res) => setIsAuth(res.ok))
      .catch(() => setIsAuth(false));
  }, []);

  // Cerrar modal automático si es error/warning
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

  // Descargar PDF desde la BD usando boleta-pdf-from-db
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4 py-8 relative">
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

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-wider">
          Registro manual de boletas
        </h2>
        <p className="text-gray-300 text-sm mb-7 text-center max-w-md">
          Usa este formulario cuando un cliente paga por WhatsApp o en efectivo.
          Se generará un ticket con QR, se enviará automáticamente al correo y
          también podrás descargarlo para enviarlo por WhatsApp.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900/70 p-6 rounded-2xl shadow-2xl flex flex-col gap-4 w-full max-w-md border border-blue-500/80"
        >
          <input
            name="nombre"
            required
            placeholder="Nombre completo"
            className="border border-gray-600 bg-black text-white p-2 rounded focus:outline-none focus:border-white transition"
          />
          <input
            name="telefono"
            required
            placeholder="Teléfono"
            className="border border-gray-600 bg-black text-white p-2 rounded focus:outline-none focus:border-white transition"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Correo electrónico"
            className="border border-gray-600 bg-black text-white p-2 rounded focus:outline-none focus:border-white transition"
          />

          <button
            type="submit"
            className={`bg-black text-white font-bold rounded py-2 px-4 transition hover:bg-blue-800 hover:text-white cursor-pointer shadow ${
              loading ? "opacity-70 cursor-wait" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrar y enviar ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}