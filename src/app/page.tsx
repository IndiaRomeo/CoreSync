"use client";

import { useState, useEffect, type CSSProperties } from "react";
import Loader from "../components/Loader";
import React from "react";
import Image from "next/image";

const videoSrc = "/video.mp4"; // Usa el nombre real de tu video

type SnowflakeStyle = CSSProperties & {
  "--snow-drift"?: string;
};

const SNOWFLAKES = Array.from({ length: 42 }, (_, index) => ({
  id: index,
  left: (index * 17) % 100,
  delay: (index * 0.73) % 12,
  duration: 8 + ((index * 7) % 5),
  size: 2 + (index % 4),
  opacity: 0.35 + ((index % 5) * 0.1),
  drift: ((index % 5) - 2) * 18,
  blur: index % 4 === 0 ? 1.5 : 0,
}));

const PAST_EVENTS = [
  {
    title: "Techno Night",
    date: "26 de agosto 2025",
    location: "Hotel Los Lagos — San Sebastián de Mariquita",
    attendance: "100 ravers",
    highlight:
      "Nuestra primera Techno Night en un hotel campestre: una inmersión industrial con energía de club y visuales que hicieron vibrar a la escena local.",
    badge: "SoldOut",
    mood: "House / Industrial / Hard Techno",
  },
];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [showTitle, setShowTitle] = useState(false);
  const [open, setOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showUrgency, setShowUrgency] = useState(false);
  const [showShareCopied, setShowShareCopied] = useState(false);
  const [tapWhatsapp, setTapWhatsapp] = useState(false);
  const [tapShare, setTapShare] = useState(false);
  const [pastEventsOpen, setPastEventsOpen] = useState(false);

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const handlePay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (payLoading) return;

    if (!buyerName || !buyerEmail || !buyerPhone) {
      alert("Por favor completa tu nombre, correo y teléfono.");
      return;
    }

    setPayLoading(true);

    try {
      // 1) Crear entrada en Supabase con datos del formulario
      const entradaRes = await fetch("/api/create-entrada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_email: buyerEmail,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          importe: 2,
          event_name: "Core Sync Collective - Noche de Velitas",
          event_date: "2025-12-06T21:00:00.000-05:00",
          event_location: "San Sebastián de Mariquita",
        }),
      });

      if (!entradaRes.ok) {
        console.error("❌ Error creando entrada:", await entradaRes.text());
        alert("No se pudo crear la entrada. Intenta de nuevo.");
        setPayLoading(false);
        return;
      }

      const { entradaId } = await entradaRes.json();

      // 2) Crear preferencia de Mercado Pago
      const prefRes = await fetch("/api/mp-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: "NOCHE DE VELITAS — Core Sync Collective",
          precio: 21999,
          entradaId,
        }),
      });

      if (!prefRes.ok) {
        console.error("❌ Error creando preferencia MP:", await prefRes.text());
        alert("No se pudo iniciar el pago. Intenta de nuevo.");
        setPayLoading(false);
        return;
      }

      const data = await prefRes.json();

      if (data.initPoint || data.init_point) {
        window.location.href = data.initPoint || data.init_point;
      } else {
        alert("No se pudo obtener el link de pago.");
        setPayLoading(false);
      }
    } catch (err) {
      console.error("Error al iniciar el pago:", err);
      alert("Ocurrió un error al iniciar el pago.");
      setPayLoading(false);
    }
  };

  // Cuando el video termina de cargar, oculta el loader
  const handleLoadedData = () => setLoading(false);

  // Oculta loader tras 2 segundos como máximo
  useEffect(() => {
    const minTimeout = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(minTimeout);
  }, []);

  // Cuando el loader termina, activa animación del título
  useEffect(() => {
    if (!loading) {
      setShowTitle(false);
      setTimeout(() => setShowTitle(true), 100);
    }
  }, [loading]);

  useEffect(() => {
    if (showTitle) {
      setTimeout(() => setShowButton(true), 250);
    } else {
      setShowButton(false);
    }
  }, [showTitle]);

  // MODAL SCROLL Y CIERRE AL HACER CLICK AFUERA
  const handleModalOverlayClick = () => {
    setOpen(false);
  };
  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  // Cierre con tecla ESC
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  useEffect(() => {
    // Mostrar notificación en intervalos
    const show = () => {
      setShowUrgency(true);
      setTimeout(() => setShowUrgency(false), 2200);
    };
    show();
    const interval = setInterval(show, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main
      role="main"
      className="relative flex flex-col items-center justify-center min-h-screen w-full bg-black overflow-x-hidden pb-48 md:pb-32"
    >
      {loading && <Loader />}

      {/* Video único, portada fullscreen */}
      <video
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        preload="auto"
        onLoadedData={handleLoadedData}
        style={{ visibility: loading ? "hidden" : "visible" }}
      />

      {/* Desenfoque y capa oscura */}
      <div className="absolute inset-0 backdrop-blur-[6px] z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-black/40 z-20 pointer-events-none" />
      <div className="snow-layer">
        {SNOWFLAKES.map((flake) => {
          const flakeStyle: SnowflakeStyle = {
            left: `${flake.left}%`,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            filter: flake.blur ? `blur(${flake.blur}px)` : undefined,
            "--snow-drift": `${flake.drift}px`,
          };
          return (
            <span
              key={flake.id}
              className="snowflake"
              style={flakeStyle}
            />
          );
        })}
      </div>

      {/* Título glitch + animación solo cuando loader termina */}
      {showTitle && (
        <div className="w-full flex flex-col items-center z-30 animate-countdown-appear">
          <h1 className="glitch animate-title-appear relative text-6xl md:text-8xl font-techno font-extrabold uppercase tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-red-700 text-center drop-shadow-[0_20px_70px_rgba(0,0,0,0.65)]">
            <span aria-hidden="true">Core Sync Collective</span>
            Core Sync Collective
            <span aria-hidden="true">Core Sync Collective</span>
            <span aria-hidden="true">Core Sync Collective</span>
          </h1>
        </div>
      )}

      {showUrgency && (
        <div
          className="
            fixed top-7 right-7 z-[110]
            bg-black/40
            backdrop-blur-md
            text-white font-bold
            px-6 py-3 rounded-xl shadow-2xl
            animate-fade-in-up animate-pulse-blink
            transition-all
            text-base md:text-lg
            flex items-center gap-2
            pointer-events-auto
          "
          style={{
            minWidth: "230px",
            maxWidth: "90vw",
          }}
        >
          <svg
            className="w-5 h-5 text-white opacity-80"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeWidth="2"
              d="M12 9v3m0 3h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0ZM12 6v2"
            />
          </svg>
          <span>¡Quedan pocas entradas disponibles!</span>
        </div>
      )}

      {/* Botón principal */}
      {showButton && (
        <button
          onClick={() => setOpen(true)}
          className="
            mt-10
            px-6 py-3
            sm:px-8 sm:py-3
            md:px-10 md:py-4
            text-lg
            sm:text-xl
            md:text-2xl
            bg-white text-black 
            font-bold 
            rounded-full shadow-xl
            border-2 border-white
            hover:bg-black hover:text-white 
            hover:scale-105 active:scale-95
            cursor-pointer transition-all transition-transform duration-200
            z-30 relative
            outline-none
            animate-button-appear
          "
        >
          Comprar boleta
        </button>
      )}

      {/* Sección eventos pasados */}
      <section className="z-30 w-full max-w-6xl px-4 mt-14">
        <div className="bg-black/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-[0_25px_120px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-xs uppercase tracking-[0.45em] text-red-700 font-semibold">
                Rave archive
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-white">
                Así han vibrado las ediciones anteriores
              </h2>
              <p className="mt-3 text-sm md:text-base text-gray-300">
                Archivamos los rituales que nos trajeron hasta aquí. Cada fecha
                sumó más comunidad, visuales y energía.
              </p>
            </div>
            <button
              onClick={() => setPastEventsOpen((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white bg-white/10 hover:bg-white/20 transition cursor-pointer"
              aria-expanded={pastEventsOpen}
              aria-controls="past-events-panel"
            >
              {pastEventsOpen ? "Ocultar ediciones" : "Ver ediciones"}
              <span
                className={`transition-transform duration-200 ${
                  pastEventsOpen ? "rotate-180" : "rotate-0"
                }`}
              >
                ▾
              </span>
            </button>
          </div>

          {!pastEventsOpen && (
            <p className="mt-4 text-sm text-gray-400 text-center md:text-left">
              Haz clic en “Ver ediciones” para desplegar los eventos
              realizados.
            </p>
          )}

          {pastEventsOpen && (
            <div
              id="past-events-panel"
              className="mt-8 grid gap-8 grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto"
            >
              {PAST_EVENTS.map((event) => (
                <article
                  key={event.title}
                  className="relative bg-gradient-to-b from-white/15 via-white/5 to-transparent border border-white/15 rounded-3xl p-[1px] overflow-hidden shadow-[0_18px_80px_rgba(0,0,0,0.85)]"
                >
                  <div className="h-full bg-black/85 rounded-3xl px-6 py-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-gray-300">
                          {event.date}
                        </p>
                        <h3 className="text-xl font-semibold text-white mt-2 tracking-wide">
                          {event.title}
                        </h3>
                      </div>
                      <span className="px-3 py-1 text-[10px] font-semibold rounded-full bg-white/10 text-white whitespace-nowrap tracking-[0.16em] uppercase">
                        {event.badge}
                      </span>
                    </div>

                    <p className="text-sm text-gray-200 leading-relaxed">
                      {event.highlight}
                    </p>

                    <div className="mt-1 text-[11px] text-gray-400 flex flex-col gap-1">
                      <span className="font-semibold text-white">
                        {event.location}
                      </span>
                      <span>{event.attendance}</span>
                      <span className="text-white/80">{event.mood}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- MODAL FLOTANTE --- */}
      {open && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={handleModalOverlayClick}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl text-gray-900 relative animate-modal-in max-w-lg w-full flex flex-col overflow-hidden"
            onClick={handleModalClick}
            tabIndex={-1}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-8 pt-6 pb-4 border-b border-gray-100/80">
              <h2 className="text-2xl font-bold">Compra tu entrada</h2>
              <button
                className="text-gray-400 hover:text-black text-2xl cursor-pointer"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                &times;
              </button>

              {/* Línea gris debajo del header */}
              <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-[1px] bg-gradient-to-r from-[#615d5d] via-[#615d5d] to-[#615d5d]" />
            </div>
            {/* Contenido */}
            <div className="px-0 pt-0 pb-0 flex-1 overflow-hidden rounded-b-2xl">
              <div className="px-8 pt-2 pb-10 max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="w-full flex justify-center mb-4">
                  <Image
                    src="/evento-foto-velitas.png"
                    alt="Flyer Core Sync Collective"
                    className="rounded-xl max-h-80 md:max-h-96 w-auto object-contain shadow-lg"
                  />
                </div>
                <div className="mt-2 rounded-2xl border border-gray-200/80 bg-white/95 px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.08)] space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block bg-black text-white text-xs px-2 py-1 rounded-full">
                      Cupos limitados
                    </span>
                    <span className="inline-block bg-gray-200 text-xs px-2 py-1 rounded-full">
                      Entrada digital
                    </span>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">
                      Evento especial
                    </p>
                    <h3 className="mt-1 text-xl font-extrabold tracking-wide">
                      NOCHE DE VELITAS — Core Sync Collective
                    </h3>
                  </div>

                  <div className="text-sm text-gray-800 space-y-1">
                    <p>
                      <span className="font-semibold">Fecha:</span> 06 de diciembre, 2025
                    </p>
                    <p>
                      <span className="font-semibold">Hora:</span> 9:00 PM
                    </p>
                  </div>

                  <div>
                    <p className="text-base">
                      <span className="font-semibold">Precio:</span> $21,999 COP{" "}
                      <span className="text-xs text-gray-500">
                        (entrada general digital)
                      </span>
                    </p>
                  </div>

                  <div className="text-xs text-gray-500">
                    <span className="font-semibold">Política de devolución:</span>{" "}
                    No hay devoluciones salvo cancelación del evento.
                  </div>

                  {/* Barcode / Línea de entrada digital */}
                  {/*<div className="mt-6 flex justify-center">
                    <div className="bg-black/90 px-4 pt-2 pb-2 rounded-lg shadow-md w-full max-w-[280px]">
                      {/* barras llenando todo el rectángulo *
                      <div
                        className="h-8 w-full rounded-md"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(to right, #ffffff 0, #ffffff 1.5px, transparent 1.5px, transparent 4px)",
                        }}
                      />
                      <p className="text-[9px] text-gray-300 mt-1 tracking-[0.25em] text-center uppercase">
                        Entry Code • Core Sync • Digital Pass
                      </p>
                    </div>
                  </div>*/}
                </div>

                {/* 🧾 Mini formulario de datos antes de pagar */}
                <form
                  onSubmit={handlePay}
                  className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-4"
                >
                  <p className="text-sm text-gray-700 mb-1">
                    Completa tus datos para generar tu entrada digital:
                  </p>

                  <input
                    required
                    placeholder="Nombre completo"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/70"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                  />

                  <input
                    required
                    type="email"
                    placeholder="Correo electrónico"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/70"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                  />

                  <input
                    required
                    placeholder="Teléfono (WhatsApp)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/70"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                  />

                  <button
                    type="submit"
                    disabled={payLoading}
                    className={`block w-full mt-2 px-6 py-3 rounded-lg text-lg text-center font-bold border-2
                    ${
                      payLoading
                        ? "bg-gray-300 text-gray-600 border-gray-400 cursor-wait"
                        : "bg-black text-white border-black hover:bg-white hover:text-black hover:border-black cursor-pointer"
                    }
                    transition-all duration-200
                  `}
                  >
                    {payLoading
                      ? "Redirigiendo a Mercado Pago..."
                      : "Pagar con Mercado Pago"}
                  </button>
                </form>

                <a
                  href="https://wa.me/573502768095"
                  className="block w-full mt-3 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg text-center font-bold border-2 border-green-600 transition-all duration-200"
                  target="_blank"
                  rel="noopener"
                >
                  Comprar por WhatsApp
                </a>
                <p className="text-xs text-gray-400 mt-2">
                  Serás redirigido a Whatsapp. Recibirás tu entrada por el
                  mismo medio o correo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante de WhatsApp */}
      <a
        href="https://wa.link/svqjia"
        target="_blank"
        rel="noopener"
        onClick={() => {
          setTapWhatsapp(true);
          setTimeout(() => setTapWhatsapp(false), 350);
        }}
        className={`
          fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 rounded-full p-4 shadow-lg transition flex items-center 
          ${tapWhatsapp ? "animate-tap" : ""}
        `}
        style={{ boxShadow: "0 6px 28px 0 #0008" }}
      >
        <svg viewBox="0 0 32 32" fill="white" width="28" height="28">
          <path d="M16 2.7A13.3 13.3 0 003.4 22.5L2 30l7.7-1.4A13.3 13.3 0 1016 2.7zm7.7 19.2c-.3.8-1.7 1.6-2.3 1.7-.6.1-1.2.1-2.1-.1-.5-.1-1.1-.2-1.9-.5a17.7 17.7 0 01-5.7-3.6 10.6 10.6 0 01-3-5.2c-.1-.5-.1-1 .1-1.3.3-.6.7-.8 1.1-.9.3 0 .6 0 1.1.8.1.1.3.4.5.6.2.2.3.4.5.7.2.3.1.5.1.6-.1.2-.2.4-.4.6-.2.2-.4.3-.6.4-.2.1-.3.2-.4.4l-.3.3c.1.2.6 1.2 2.5 2.9 1.7 1.5 2.9 2 3.1 2 .1-.1.2-.1.3-.1.2 0 .4 0 .7.2.2.1.3.1.4.2.2 0 .3.2.5.3.3.1.6.3 1 .3.4 0 .7-.2 1-.5.3-.3.7-.7.7-1.2 0-.2-.1-.4-.2-.5z" />
        </svg>
      </a>

      {/* Botón flotante de Compartir */}
      <button
        onClick={async () => {
          setTapShare(true);
          setTimeout(() => setTapShare(false), 350);
          const shareData = {
            title: "Core Sync Collective - Evento Techno",
            text: "¡No te pierdas este evento! 06 de diciembre, San Sebastián de Mariquita.",
            url:
              typeof window !== "undefined"
                ? window.location.href
                : "https://coresync.com",
          };
          if (navigator.share) {
            try {
              await navigator.share(shareData);
            } catch {
              // usuario canceló o error, puedes ignorar
            }
          } else {
            try {
              await navigator.clipboard.writeText(shareData.url);
              setShowShareCopied(true);
              setTimeout(() => setShowShareCopied(false), 2200);
            } catch {
              alert("No se pudo copiar el enlace.");
            }
          }
        }}
        className={`
          fixed bottom-24 right-6 z-50
          bg-black/80 hover:bg-white/80
          border-2 border-white
          rounded-full p-4 shadow-lg transition
          flex items-center
          focus:outline-none
          active:scale-95
          cursor-pointer
          ${tapShare ? "animate-tap" : ""}
        `}
        aria-label="Compartir evento"
        style={{
          boxShadow: "0 6px 28px 0 #0008",
          backdropFilter: "blur(8px)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 8.25V6.75A3.75 3.75 0 0 0 11.25 3a3.75 3.75 0 0 0-3.75 3.75v1.5M7.5 8.25V6.75m0 1.5H15"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="19.5"
            cy="17.5"
            r="2.5"
            fill="#fff"
            fillOpacity="0.15"
            stroke="white"
            strokeWidth="2"
          />
          <circle
            cx="4.5"
            cy="17.5"
            r="2.5"
            fill="#fff"
            fillOpacity="0.15"
            stroke="white"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="white"
            strokeWidth="2"
          />
          <path
            d="M7.5 17.5l4.5-4 4.5 4"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Redes sociales */}
      <footer className="w-full absolute bottom-4 flex items-center justify-center z-40 gap-8">
        <a
          href="https://www.instagram.com/coresync_collective/"
          target="_blank"
          rel="noopener"
          className="hover:scale-110 transition"
        >
          <svg
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            className="text-white"
          >
            <rect
              x="2"
              y="2"
              width="20"
              height="20"
              rx="5"
              strokeWidth="2"
            />
            <path
              d="M16 11.37A4 4 0 1 1 12.63 8a4 4 0 0 1 3.37 3.37z"
              strokeWidth="2"
            />
            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
          </svg>
        </a>
      </footer>

      {showShareCopied && (
        <div
          className="
          fixed top-7 right-7 z-[150]
          bg-black/90 text-white px-6 py-3 rounded-xl shadow-2xl
          animate-fade-in-up
          font-semibold text-base
          pointer-events-none
        "
        >
          ¡Enlace copiado!
        </div>
      )}
    </main>
  );
}