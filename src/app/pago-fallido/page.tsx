"use client";

import Link from "next/link";

export default function PagoFallidoPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">
        Hubo un problema con tu pago 😕
      </h1>
      <p className="text-center text-gray-300 mb-6 max-w-md">
        El pago fue rechazado o cancelado. Puedes intentar nuevamente o escribirnos por WhatsApp para ayudarte.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-black hover:text-white border border-white transition"
        >
          Volver a intentar
        </Link>
        <a
          href="https://wa.link/svqjia"
          target="_blank"
          rel="noopener"
          className="px-6 py-3 rounded-full bg-green-500 text-white font-bold hover:bg-green-600 transition"
        >
          Hablar por WhatsApp
        </a>
      </div>
    </main>
  );
}