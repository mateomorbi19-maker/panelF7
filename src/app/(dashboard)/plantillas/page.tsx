import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import type { PlantillaRow } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const ESTADO_STYLES: Record<PlantillaRow["estado"], string> = {
  pendiente: "bg-yellow-500/15 text-yellow-400",
  aprobada: "bg-green-500/15 text-green-400",
  rechazada: "bg-f7red/15 text-f7red",
};

const ESTADO_LABEL: Record<PlantillaRow["estado"], string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

export default async function PlantillasPage() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("plantillas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex-1 p-6">
        <p className="text-f7red">Error: {error.message}</p>
      </div>
    );
  }

  const plantillas = (data ?? []) as PlantillaRow[];

  return (
    <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="mb-5 md:mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Plantillas</h1>
          <p className="text-sm text-slate-400 mt-1">
            Mensajes pre-aprobados por Meta para usar en campañas.
          </p>
        </div>
        <Link
          href="/plantillas/nueva"
          className="inline-flex items-center gap-2 bg-f7red hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-f7red/20 transition active:scale-[0.98]"
        >
          <Plus size={18} />
          Crear plantilla
        </Link>
      </div>

      {plantillas.length === 0 ? (
        <div className="bg-f7panel rounded-2xl border border-f7border p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-f7panel2 border border-f7border mb-4">
            <FileText className="text-slate-500" size={28} strokeWidth={1.5} />
          </div>
          <h3 className="text-white font-semibold mb-1">No hay plantillas aún</h3>
          <p className="text-sm text-slate-400 mb-5">
            Creá tu primera plantilla para poder enviar campañas.
          </p>
          <Link
            href="/plantillas/nueva"
            className="inline-flex items-center gap-2 bg-f7red hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg shadow-f7red/20 transition"
          >
            <Plus size={18} />
            Crear la primera plantilla
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plantillas.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-f7border bg-f7panel p-4 hover:shadow-lg hover:border-f7red/40 transition flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-sm font-semibold text-white truncate">
                  {p.nombre}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${ESTADO_STYLES[p.estado]}`}
                >
                  {ESTADO_LABEL[p.estado]}
                </span>
              </div>
              <div className="flex gap-1 flex-wrap mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-f7panel2 text-slate-300 border border-f7border">
                  {p.categoria}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-f7panel2 text-slate-300 border border-f7border">
                  {p.idioma}
                </span>
              </div>
              <p className="text-sm text-slate-400 line-clamp-3 mb-3 flex-1">
                {p.cuerpo.length > 120 ? p.cuerpo.slice(0, 120) + "…" : p.cuerpo}
              </p>
              <p className="text-[11px] text-slate-500">
                Creada hace{" "}
                {formatDistanceToNow(new Date(p.created_at), { locale: es })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
