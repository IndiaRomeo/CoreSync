"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PagoExitosoClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const externalRef = searchParams?.get("external_reference") || undefined;

  // Redirigir automáticamente a la home después de X segundos
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/");
    }, 10000); // 10 segundos

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-4 py-10">
      {/* Fondo tipo glow */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black via-[#050816] to-black" />
      <div className="absolute inset-0 -z-10 opacity-40 blur-3xl bg-[radial-gradient(circle_at_top,_#22c55e55,_transparent_60%),radial-gradient(circle_at_bottom,_#a855f755,_transparent_60%)]" />

      <section className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/60 px-6 py-8 md:px-8 md:py-10">
          {/* Check animado */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 border border-emerald-300/60 shadow-lg">
                <span className="text-3xl">✓</span>
              </div>
              <div className="absolute inset-0 rounded-full border border-emerald-400/60 animate-ping" />
            </div>
          </div>

          {/* Títulos */}
          <h1 className="text-center text-2xl md:text-3xl font-semibold tracking-tight">
            Pago aprobado 🔥
          </h1>
          <p className="mt-2 text-center text-sm uppercase tracking-[0.2em] text-emerald-400/90">
            Core Sync Collective
          </p>

          {/* Mensaje principal */}
          <p className="mt-5 text-sm md:text-base text-gray-200 text-center leading-relaxed">
            Tu entrada ha sido confirmada.
            En unos momentos recibirás tu{" "}
            <span className="font-semibold text-white">
              ticket digital en el correo que registraste
            </span>
            . Podrás mostrarlo desde tu celular en la entrada del evento.
          </p>

          {/* Info adicional / WhatsApp / soporte */}
          <div className="mt-5 space-y-2 text-xs md:text-sm text-gray-400 text-center">
            <p>
              Si no ves el correo en tu bandeja de entrada, revisa también{" "}
              <span className="text-gray-200 font-medium">Spam</span> o
              “Promociones”.
            </p>

            {externalRef && (
              <p>
                En caso de cualquier inconveniente, puedes{" "}
                <a
                  href={`/api/boleta-pdf-from-db?id=${externalRef}`}
                  className="underline underline-offset-2 text-gray-100 hover:text-emerald-400 transition"
                >
                  descargar tu ticket desde este enlace
                </a>
                .
              </p>
            )}

            <p className="pt-2 border-t border-white/5">
              Para soporte escríbenos a{" "}
              <a
                href="mailto:collectivecoresync@gmail.com"
                className="text-gray-100 hover:text-emerald-400 underline underline-offset-2"
              >
                collectivecoresync@gmail.com
              </a>
              .
            </p>
          </div>

          {/* Botón principal */}
          <div className="mt-7 flex flex-col items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white text-black text-sm md:text-base font-semibold px-6 py-2.5 hover:bg-transparent hover:text-white transition-colors duration-200"
            >
              Volver al sitio
            </Link>
            <p className="text-[11px] md:text-xs text-gray-500">
              Serás redirigido automáticamente al sitio en unos segundos…
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}