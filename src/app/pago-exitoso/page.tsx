import { Suspense } from "react";
import PagoExitosoClient from "./PagoExitosoClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-white p-10">Cargando...</div>}>
      <PagoExitosoClient />
    </Suspense>
  );
}