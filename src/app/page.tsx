"use client";

import { useState, useEffect, type CSSProperties } from "react";
import Loader from "../components/Loader";
import React from "react";

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
    title: "Core Sync: Genesis",
    date: "Marzo 2024",
    location: "Bodega 27 - Mariquita",
    attendance: "200 ravers",
    highlight:
      "Convertimos una vieja bodega en un rave inmersivo con visuales analógicos y láseres sincronizados.",
    badge: "Sold Out",
    mood: "Industrial techno / Acid",
  },
  {
    title: "Core Sync Sunset",
    date: "Junio 2024",
    location: "Mirador del Calvario - Mariquita",
    attendance: "180 asistentes",
    highlight:
      "Sesión sunset que arrancó con house melódico y terminó con techno acelerado frente al amanecer.",
    badge: "Sunset Edition",
    mood: "House progresivo / Peak time",
  },
  {
    title: "Core Sync Ritual",
    date: "Octubre 2024",
    location: "Bosque La Ceiba - Mariquita",
    attendance: "220 asistentes",
    highlight:
      "Llevamos el sonido a un espacio natural con mapping sobre los árboles y performance visual en vivo.",
    badge: "Edición especial",
    mood: "Hypnotic techno / Live visuals",
  },
];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [showTitle, setShowTitle] = useState(false);
  const [open, setOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const eventDate = new Date("2025-12-06T21:00:00-05:00");
  const [showUrgency, setShowUrgency] = useState(false);
  const [showShareCopied, setShowShareCopied] = useState(false);
  const [tapWhatsapp, setTapWhatsapp] = useState(false);
  const [tapShare, setTapShare] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [tapCountdown, setTapCountdown] = useState(false);

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
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0,
    expired: false,
  });

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
    function updateCountdown() {
      const now = new Date();
      const diff = eventDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Mostrar notificación en intervalosf
    const show = () => {
      setShowUrgency(true);
      setTimeout(() => setShowUrgency(false), 2200);
    };
    show();
    const interval = setInterval(show, 7000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showTitle) {
      setTimeout(() => setShowCountdown(true), 100);
    } else {
      setShowCountdown(false);
    }
  }, [showTitle]);

  //AÑADE ESTO DENTRO DEL COMPONENTE Home
  const handlePay = async () => {
    try {
      const res = await fetch("/api/mp-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "NOCHE DE VELITAS — Core Sync Collective",
          quantity: 1,
          unit_price: 1000,
        }),
      });

      const data = await res.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("No se pudo crear la preferencia de pago.");
      }
    } catch (error) {
      console.error("Error al pagar:", error);
      alert("Ocurrió un error al iniciar el pago.");
    }
  };

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
          return <span key={flake.id} className="snowflake" style={flakeStyle} />;
        })}
      </div>

      {/* Título glitch + animación solo cuando loader termina */}
      {showTitle && (
        <div className="w-full flex flex-col items-center z-30 animate-countdown-appear">
          <h1 className="glitch animate-title-appear relative text-5xl md:text-7xl font-techno font-extrabold uppercase tracking-wider text-white text-center drop-shadow-2xl">
            <span aria-hidden="true">Core Sync Collective</span>
            Core Sync Collective
            <span aria-hidden="true">Core Sync Collective</span>
            <span aria-hidden="true">Core Sync Collective</span>
          </h1>

          {/* --- Conteo regresivo debajo del título --- */}
          <div className={`
            mt-7 mb-3 flex gap-4 text-center
            text-3xl md:text-4xl font-bold text-white tracking-wide
            font-mono
            rounded-2xl px-4 py-3
            bg-black/70 shadow-lg border border-white/10
            ${showCountdown ? "animate-countdown-appear" : ""}
            cursor-pointer
            transition-transform duration-300
            hover:scale-110
            ${tapCountdown ? "scale-110" : ""}
          `}
          onClick={() => {
            // Esto sigue para el efecto click en PC/tablet (puedes dejarlo)
            setTapCountdown(true);
            setTimeout(() => setTapCountdown(false), 300);
          }}
          onTouchStart={() => {
            setTapCountdown(true);
            setTimeout(() => setTapCountdown(false), 300);
          }}
          >
            {timeLeft.expired ? (
              <span className="text-pink-600">¡El evento ha comenzado!</span>
            ) : (
              <>
                <div>
                  <span className="block">{String(timeLeft.days).padStart(2, "0")}</span>
                  <span className="text-base font-normal uppercase tracking-widest text-gray-300">días</span>
                </div>
                <div>:</div>
                <div>
                  <span className="block">{String(timeLeft.hours).padStart(2, "0")}</span>
                  <span className="text-base font-normal uppercase tracking-widest text-gray-300">horas</span>
                </div>
                <div>:</div>
                <div>
                  <span className="block">{String(timeLeft.minutes).padStart(2, "0")}</span>
                  <span className="text-base font-normal uppercase tracking-widest text-gray-300">min</span>
                </div>
                <div>:</div>
                <div>
                  <span className="block">{String(timeLeft.seconds).padStart(2, "0")}</span>
                  <span className="text-base font-normal uppercase tracking-widest text-gray-300">seg</span>
                </div>
              </>
            )}
          </div>
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
          <svg className="w-5 h-5 text-white opacity-80" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 9v3m0 3h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0ZM12 6v2"/></svg>
          <span>¡Quedan pocas entradas disponibles!</span>
        </div>
      )}

      {/* El botón va aquí, FUERA del bloque anterior */}
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

      <section className="z-30 w-full max-w-5xl px-4 mt-14">
        <div className="bg-black/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-[0_25px_120px_rgba(0,0,0,0.45)]">
          <div className="mb-8 text-center md:text-left">
            <p className="text-xs uppercase tracking-[0.45em] text-pink-400 font-semibold">Eventos pasados</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-white">Así han vibrado las ediciones anteriores</h2>
            <p className="mt-3 text-sm md:text-base text-gray-300">
              Archivamos los rituales que nos trajeron hasta aquí. Cada fecha sumó más comunidad, visuales y energía.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PAST_EVENTS.map((event) => (
              <article
                key={event.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/40 transition duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-gray-300">{event.date}</p>
                    <h3 className="text-xl font-semibold text-white mt-2">{event.title}</h3>
                  </div>
                  <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-white/10 text-white whitespace-nowrap">
                    {event.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">{event.highlight}</p>
                <div className="text-xs text-gray-400 flex flex-col gap-1">
                  <span className="font-semibold text-white">{event.location}</span>
                  <span>{event.attendance}</span>
                  <span className="text-white/80">{event.mood}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --- MODAL FLOTANTE (ya corregido el scroll y bordes redondos) --- */}
      {open && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={handleModalOverlayClick}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl text-gray-900 relative animate-modal-in max-w-lg w-full flex flex-col"
            onClick={handleModalClick}
            tabIndex={-1}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-2">
              <h2 className="text-2xl font-bold">Compra tu entrada</h2>
              <button
                className="text-gray-400 hover:text-black text-2xl"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >&times;</button>
            </div>
            {/* Contenido */}
            <div className="px-0 pt-0 pb-0 flex-1 overflow-hidden rounded-b-2xl">
              <div className="px-8 pt-2 pb-10 max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <img
                src="/evento-foto.jpg"
                alt="Flyer Core Sync Collective"
                className="rounded-xl w-full mb-4 max-h-64 object-cover shadow-lg"
              />
              <div className="mb-2">
                <span className="inline-block bg-black text-white text-xs px-2 py-1 rounded-full mr-2">Cupos limitados</span>
                <span className="inline-block bg-gray-200 text-xs px-2 py-1 rounded-full">Entrada digital</span>
              </div>
              <div className="mb-4">
                <strong>Evento:</strong> Core Sync Collective<br />
                <strong>Lugar:</strong> San Sebastián de Mariquita<br />
                <strong>Fecha:</strong> 06 de diciembre, 2025<br />
                <strong>Hora:</strong> 9:00 PM
              </div>
              <div className="mb-4">
                <strong>Precio:</strong> $30.000 COP <span className="text-xs text-gray-400">(incluye entrada)</span>
              </div>
              <div className="mb-4 flex items-center gap-2">
                <strong>Ubicación:</strong>
                <a
                  href="https://maps.app.goo.gl/BW8C2Rj1kDQN3pUj9"
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-1 text-gray-700 hover:text-blue-900 font-semibold no-underline transition"
                >
                  Ver mapa
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5Z"/></svg>
                </a>
              </div>
              <div className="mb-2 text-xs text-gray-500">
                <span className="font-bold">Política de devolución:</span> No hay devoluciones salvo cancelación del evento.
              </div>
              <div className="mb-4">
                <strong>Line-up:</strong>
                <ul className="list-disc pl-6 text-sm mt-1">
                  <li>DJ DANI P</li>
                  <li>DJ DANZER</li>
                  <li>DJ SARIAH</li>
                  <li>DJ JAVB</li>
                  <li>DJ BASTARD</li>
                </ul>
              </div>
              <button
                onClick={handlePay}
                className="block w-full mt-4 bg-black hover:bg-white text-white hover:text-black px-6 py-3 rounded-lg text-lg text-center font-bold border-2 border-black hover:border-black transition-all duration-200 cursor-pointer"
              >
                Pagar con Mercado Pago
              </button>

              <a
                href="https://wa.link/svqjia"
                className="block w-full mt-3 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg text-center font-bold border-2 border-green-600 transition-all duration-200"
                target="_blank"
                rel="noopener"
              >
                Comprar por WhatsApp
              </a>
              <p className="text-xs text-gray-400 mt-2">Serás redirigido a Whatsapp. Recibirás tu entrada por el mismo medio o correo.</p>
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
        <svg viewBox="0 0 32 32" fill="white" width="28" height="28"><path d="M16 2.7A13.3 13.3 0 003.4 22.5L2 30l7.7-1.4A13.3 13.3 0 1016 2.7zm7.7 19.2c-.3.8-1.7 1.6-2.3 1.7-.6.1-1.2.1-2.1-.1-.5-.1-1.1-.2-1.9-.5a17.7 17.7 0 01-5.7-3.6 10.6 10.6 0 01-3-5.2c-.1-.5-.1-1 .1-1.3.3-.6.7-.8 1.1-.9.3 0 .6 0 1.1.8.1.1.3.4.5.6.2.2.3.4.5.7.2.3.1.5.1.6-.1.2-.2.4-.4.6-.2.2-.4.3-.6.4-.2.1-.3.2-.4.4l-.3.3c.1.2.6 1.2 2.5 2.9 1.7 1.5 2.9 2 3.1 2 .1-.1.2-.1.3-.1.2 0 .4 0 .7.2.2.1.3.1.4.2.2 0 .3.2.5.3.3.1.6.3 1 .3.4 0 .7-.2 1-.5.3-.3.7-.7.7-1.2 0-.2-.1-.4-.2-.5z"/></svg>
      </a>

      {/* Botón flotante de Compartir */}
      <button
        onClick={async () => {
          setTapShare(true);
          setTimeout(() => setTapShare(false), 350);
          const shareData = {
            title: "Core Sync Collective - Evento Techno",
            text: "¡No te pierdas este evento! 06 de diciembre, San Sebastián de Mariquita.",
            url: typeof window !== "undefined" ? window.location.href : "https://coresync.com",
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
          <path d="M15 8.25V6.75A3.75 3.75 0 0 0 11.25 3a3.75 3.75 0 0 0-3.75 3.75v1.5M7.5 8.25V6.75m0 1.5H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="19.5" cy="17.5" r="2.5" fill="#fff" fillOpacity="0.15" stroke="white" strokeWidth="2"/>
          <circle cx="4.5" cy="17.5" r="2.5" fill="#fff" fillOpacity="0.15" stroke="white" strokeWidth="2"/>
          <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2"/>
          <path d="M7.5 17.5l4.5-4 4.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Redes sociales */}
      <footer className="w-full absolute bottom-4 flex items-center justify-center z-40 gap-8">
        <a href="https://www.instagram.com/coresync_collective/" target="_blank" rel="noopener" className="hover:scale-110 transition">
          <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-white">
            <rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="2"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8a4 4 0 0 1 3.37 3.37z" strokeWidth="2"/>
            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
          </svg>
        </a>
        <a
          href="https://www.facebook.com/CoreSyncCollective/"
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
            <path
              d="M18 2h-3a5 5 0 0 0-5 5v3H5v4h5v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
              strokeWidth="2"
            />
          </svg>
        </a>
      </footer>

      {/* Botón sticky de compra SOLO visible en móviles y tablets 
      <button
        onClick={() => setOpen(true)}
        className={`
          fixed bottom-4 left-1/2 -translate-x-1/2 z-50
          w-[92vw] max-w-xs
          bg-white text-black font-bold rounded-full shadow-xl
          border-2 border-white
          py-3 text-lg
          flex items-center justify-center
          transition-all duration-200
          hover:bg-black hover:text-white active:scale-95
          md:hidden
        `}
      >
        Comprar boleta
      </button>*/}

      {showShareCopied && (
        <div className="
          fixed top-7 right-7 z-[150]
          bg-black/90 text-white px-6 py-3 rounded-xl shadow-2xl
          animate-fade-in-up
          font-semibold text-base
          pointer-events-none
        ">
          ¡Enlace copiado!
        </div>
      )}

    </main>
  );
}
