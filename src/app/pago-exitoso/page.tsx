"use client";

import Link from "next/link";

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function PagoExitosoPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const externalRef = searchParams?.external_reference as string | undefined;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">
        ¡Pago aprobado! 🔥
      </h1>
      <p className="text-center text-gray-300 mb-6 max-w-md">
        Tu entrada para <strong>Core Sync Collective</strong> ha sido confirmada.
        Revisa tu correo o WhatsApp para recibir la boleta digital.
      </p>

      {externalRef && (
        <Link
          href={`/api/boleta-pdf-from-db?id=${externalRef}`}
          className="mt-4 px-4 py-2 rounded bg-white text-black font-bold"
        >
          Descargar tu ticket (PDF)
        </Link>
      )}

      <Link
        href="/"
        className="mt-4 px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-black hover:text-white border border-white transition"
      >
        Volver a la página principal
      </Link>
    </main>
  );
}