"use client";

import { useState, useEffect, useMemo } from "react";
import Loader from "../components/Loader";

const videoSrc = "/video.mp4"; // Usa el nombre real de tu video

const pastEvents = [
  {
    title: "Core Sync Collective · Vol. 1",
    date: "Marzo 2024",
    location: "San Sebastián de Mariquita",
    highlight: "Transformamos el antiguo teatro en un club inmersivo con visuales envolventes y sonidos analógicos.",
    attendance: "200 asistentes",
  },
  {
    title: "Core Sync Collective · Jungle Session",
    date: "Junio 2024",
    location: "Finca experimental, Honda",
    highlight: "Montamos una cabina 360° al aire libre con back-to-back de DJ locales y proyección mapping.",
    attendance: "150 asistentes",
  },
  {
    title: "Core Sync Collective · Black Edition",
    date: "Agosto 2024",
    location: "Warehouse secreto, Ibagué",
    highlight: "Tuvimos un takeover techno industrial con iluminación láser y performance de arte digital.",
    attendance: "250 asistentes",
  },
];

const pseudoRandom = (seed: number) => Math.abs(Math.sin(seed * 9999));

type Snowflake = {
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [showTitle, setShowTitle] = useState(false);
  const [open, setOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const eventDate = useMemo(() => new Date("2024-12-06T21:00:00-05:00"), []);
  const eventDateLabel = "6 de diciembre, 2024";
  const eventTimeLabel = "9:00 PM";
  const shareText = `¡No te pierdas este evento! ${eventDateLabel}, San Sebastián de Mariquita.`;
  const eventDate = new Date("2025-12-06T21:00:00-05:00");
  const [showUrgency, setShowUrgency] = useState(false);
  const [showShareCopied, setShowShareCopied] = useState(false);
  const [tapWhatsapp, setTapWhatsapp] = useState(false);
  const [tapShare, setTapShare] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [tapCountdown, setTapCountdown] = useState(false);
  const snowflakes = useMemo<Snowflake[]>(
    () =>
      Array.from({ length: 45 }, (_, index) => ({
        left: pseudoRandom(index + 1) * 100,
        delay: pseudoRandom(index + 50) * 12,
        duration: 8 + pseudoRandom(index + 100) * 10,
        size: 10 + pseudoRandom(index + 150) * 18,
        opacity: 0.25 + pseudoRandom(index + 200) * 0.55,
      })),
  const [snowflakes, setSnowflakes] = useState<
    { id: number; left: number; delay: number; duration: number; size: number }[]
  >([]);
  const pastEvents = useMemo(
    () => [
      {
        title: "Core Sync Collective · Acid Bloom",
        dateLabel: "16 de agosto de 2024",
        location: "San Sebastián de Mariquita",
        highlight: "Sold out en 48 horas",
        description:
          "Fusionamos visuales generativos con un set de techno ácido que hizo vibrar la plaza principal.",
        tags: ["320 ravers", "Techno ácido", "Visuales inmersivos"],
        accent: "from-pink-500/50 via-purple-500/20 to-transparent",
      },
      {
        title: "Core Sync Collective · Jungle Pulse",
        dateLabel: "22 de abril de 2024",
        location: "Finca La Cabaña · Mariquita",
        highlight: "After party hasta el amanecer",
        description:
          "Montamos un escenario 360° rodeado de vegetación para un viaje entre hard groove y ritmos orgánicos.",
        tags: ["After hours", "360° stage", "Live VJ"],
        accent: "from-emerald-400/40 via-cyan-500/20 to-transparent",
      },
      {
        title: "Core Sync Collective · Origins",
        dateLabel: "3 de diciembre de 2023",
        location: "Rooftop privado · Ibagué",
        highlight: "Crew íntima & vinyl only",
        description:
          "Una edición boutique para coleccionistas con warmup analógico y selección de vinilos underground.",
        tags: ["Vinyl only", "Ibagué", "Edición limitada"],
        accent: "from-amber-400/40 via-red-500/20 to-transparent",
      },
    ],
    []
  );

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
  }, [eventDate]);

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

  useEffect(() => {
    const flakes = Array.from({ length: 45 }, (_, index) => ({
      id: index,
      left: Math.random() * 100,
      delay: Math.random() * 6,
      duration: 8 + Math.random() * 6,
      size: Math.random() * 4 + 2,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <>
      <main role="main" className="relative flex flex-col items-center justify-start min-h-screen w-full bg-black overflow-x-hidden">
      {loading && <Loader />}

      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden="true">
        {snowflakes.map((flake, index) => (
          <span
            key={`${flake.left}-${index}`}
            className="snowflake"
            style={{
              left: `${flake.left}%`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
              fontSize: `${flake.size}px`,
              opacity: flake.opacity,
            }}
          >
            ❄
          </span>
        ))}
      </div>

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
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 25 }}
        aria-hidden="true"
      >
        {snowflakes.map((flake) => (
          <span
            key={flake.id}
            className="snowflake"
            style={{
              left: `${flake.left}%`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
              width: flake.size,
              height: flake.size,
            }}
          />
        ))}
      </div>

      <div className="relative z-30 flex min-h-screen w-full flex-col items-center justify-center px-4 text-center text-white">
        {/* Título glitch + animación solo cuando loader termina */}
        {showTitle && (
          <div className="w-full max-w-4xl flex flex-col items-center animate-countdown-appear">
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
            relative
            outline-none
            animate-button-appear
          "
          >
            Comprar boleta
          </button>
        )}

        <footer className="absolute bottom-4 left-0 flex w-full items-center justify-center gap-8 text-white">
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
      </div>

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

      <section className="relative z-30 mt-16 w-full max-w-5xl px-6 pb-32">
        <div className="bg-black/70 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl text-white p-6 sm:p-10">
          <div className="flex flex-col gap-2 mb-8">
            <p className="uppercase text-sm tracking-[0.3em] text-pink-400 font-semibold">Eventos anteriores</p>
            <h3 className="text-3xl sm:text-4xl font-bold">Nuestro historial rave</h3>
            <p className="text-base text-gray-200 max-w-3xl">
              Documentamos cada experiencia para mejorar la próxima noche. Estos son algunos de los capítulos que han marcado
              la energía de Core Sync Collective.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {pastEvents.map((event) => (
              <article
                key={`${event.title}-${event.date}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-lg hover:border-pink-400/60 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.25em] text-gray-300">{event.date}</span>
                  <h4 className="text-2xl font-semibold">{event.title}</h4>
                  <p className="text-sm text-gray-300">{event.location}</p>
                </div>
                <p className="text-base text-gray-100 mt-4 leading-relaxed">{event.highlight}</p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-black/50 border border-white/5 px-4 py-1 text-sm text-gray-200">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M12 7a5 5 0 0 1 5 5v3h1.5a1.5 1.5 0 0 1 0 3H5.5a1.5 1.5 0 0 1 0-3H7v-3a5 5 0 0 1 5-5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path d="M8 19a4 4 0 0 0 8 0" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  {event.attendance}
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
                <strong>Fecha:</strong> {eventDateLabel}<br />
                <strong>Hora:</strong> {eventTimeLabel}
                <strong>Fecha:</strong> 6 de diciembre, 2025<br />
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
              <a
                href="https://wa.link/svqjia"
                className="block mt-4 bg-black hover:bg-white text-white hover:text-black px-6 py-3 rounded-lg text-lg text-center font-bold border-2 border-black hover:border-black transition-all duration-200"
                target="_blank"
                rel="noopener"
              >
                Comprar ahora
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
            text: shareText,
            text: "¡No te pierdas este evento! 6 de diciembre, San Sebastián de Mariquita.",
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

      <section className="relative z-30 w-full px-6 pb-32 pt-16">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-black/70 px-6 py-12 shadow-2xl backdrop-blur-3xl">
          <div className="text-center text-white">
            <p className="text-xs uppercase tracking-[0.5em] text-pink-200">Nuestro legado</p>
            <h3 className="mt-2 text-3xl font-bold md:text-4xl">Eventos anteriores</h3>
            <p className="mx-auto mt-4 max-w-3xl text-base text-gray-300">
              Llevamos varias ediciones conectando a la comunidad techno con atmósferas inmersivas,
              visuales hechas en casa y una curaduría que no pierde la esencia underground.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {pastEvents.map((event) => (
              <article
                key={event.title}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-left text-white backdrop-blur-xl shadow-lg"
              >
                <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${event.accent}`} aria-hidden="true" />
                <div className="relative">
                  <div className="flex flex-col gap-1 text-xs uppercase tracking-[0.35em] text-gray-200/80">
                    <span>{event.dateLabel}</span>
                    <span className="text-pink-100">{event.highlight}</span>
                  </div>
                  <h4 className="mt-4 text-2xl font-bold">{event.title}</h4>
                  <p className="mt-2 text-sm text-gray-200">{event.description}</p>
                  <p className="mt-3 flex items-center gap-2 text-sm text-gray-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-pink-200">
                      <path
                        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5Z"
                        fill="currentColor"
                      />
                    </svg>
                    {event.location}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span
                        key={`${event.title}-${tag}`}
                        className="rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs uppercase tracking-wider text-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

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
    <style jsx global>{`
        .snowflake {
          position: absolute;
          top: -10%;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.5) 60%, transparent 100%);
          opacity: 0.8;
          animation-name: snowfall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }

        @keyframes snowfall {
          0% {
            transform: translate3d(0, -10vh, 0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 110vh, 0);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
