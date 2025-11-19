"use client";

import Link from "next/link";

export default function PagoPendientePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">
        Tu pago está pendiente ⏳
      </h1>
      <p className="text-center text-gray-300 mb-6 max-w-md">
        Estamos esperando la confirmación del pago (por ejemplo, si es PSE). 
        Te notificaremos cuando se acredite.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-black hover:text-white border border-white transition"
      >
        Volver al inicio
      </Link>
    </main>
  );
}