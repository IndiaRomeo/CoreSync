import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LogParams = {
  codigo: string;
  resultado: string;        // "VALIDADO" | "YA USADO" | "NO ENCONTRADO" | ...
  validador: string;        // nombre/código del validador
  nombre?: string;
  email?: string;
  cedula?: string;
  estado?: string;          // estado de la entrada ("Pagado", "Reservado"...)
  entradaId?: string;       // uuid de entradas.id
};

export async function registrarLogValidacion({
  codigo,
  resultado,
  validador,
  nombre,
  email,
  cedula,
  estado,
  entradaId,
}: LogParams) {
  const { error } = await supabaseAdmin
    .from("logs_validacion")
    .insert({
      codigo,
      resultado,
      validador,
      nombre: nombre ?? null,
      email: email ?? null,
      cedula: cedula ?? null,
      estado: estado ?? null,
      entrada_id: entradaId ?? null,
      fecha: new Date().toISOString(),
    });

  if (error) {
    console.error("❌ Error al registrar log de validación:", error);
  }
}