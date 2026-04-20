import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Megaphone, Plus } from "lucide-react";
import type { CampanaRow, PlantillaRow } from "@/types/database";

export const dynamic = "force-dynamic";

type CampanaConPlantilla = CampanaRow & {
  plantilla?: Pick<PlantillaRow, "nombre"> | null;
};

const ESTADO_STYLES: Record<CampanaRow["estado"], string> = {
  borrador: "bg-slate-500/20 text-slate-300",
  enviando: "bg-f7blue/20 text-f7blue",
  completada: "bg-green-500/15 text-green-400",
};

const ESTADO_LABEL: Record<CampanaRow["estado"], string> = {
  borrador: "Borrador",
  enviando: "Enviando",
  completada: "Completada",
};

export default async function CampanasPage() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("campanas")
    .select("*, plantilla:plantillas(nombre)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex-1 p-6">
        <p className="text-f7red">Error: {error.message}</p>
      </div>
    );
  }

  const campanas = (data ?? []) as CampanaConPlantilla[];

  return (
    <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="mb-5 md:mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Campañas</h1>
          <p className="text-sm text-slate-400 mt-1">
            Envíos masivos de mensajes a tus contactos.
          </p>
        </div>
        <Link
          href="/campanas/nueva"
          className="inline-flex items-center gap-2 bg-f7red hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-f7red/20 transition active:scale-[0.98]"
        >
          <Plus size={18} />
          Nueva campaña
        </Link>
      </div>

      {campanas.length === 0 ? (
        <div className="bg-f7panel rounded-2xl border border-f7border p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-f7panel2 border border-f7border mb-4">
            <Megaphone className="text-slate-500" size={28} strokeWidth={1.5} />
          </div>
          <h3 className="text-white font-semibold mb-1">
            Aún no creaste campañas
          </h3>
          <p className="text-sm text-slate-400 mb-5">
            Seleccioná contactos y armá tu primera campaña.
          </p>
          <Link
            href="/campanas/nueva"
            className="inline-flex items-center gap-2 bg-f7red hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg shadow-f7red/20 transition"
          >
            <Plus size={18} />
            Nueva campaña
          </Link>
        </div>
      ) : (
        <div className="space-y-3 max-w-4xl">
          {campanas.map((c) => {
            const total = c.total_contactos || 0;
            const pct = total > 0 ? Math.round((c.enviados / total) * 100) : 0;
            return (
              <div
                key={c.id}
                className="rounded-xl border border-f7border bg-f7panel p-4 shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-white">{c.nombre}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${ESTADO_STYLES[c.estado]}`}
                  >
                    {ESTADO_LABEL[c.estado]}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Plantilla:{" "}
                  <span className="font-mono text-slate-300">
                    {c.plantilla?.nombre ?? "—"}
                  </span>
                </p>
                <div className="mb-1">
                  <p className="text-xs text-slate-400">
                    {c.enviados} de {total} enviados
                    {c.fallidos > 0 && ` • ${c.fallidos} fallidos`}
                  </p>
                  {c.estado === "enviando" && (
                    <div className="w-full h-1.5 rounded-full bg-f7panel2 mt-2 overflow-hidden">
                      <div
                        className="h-full bg-f7blue transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Creada hace{" "}
                  {formatDistanceToNow(new Date(c.created_at), { locale: es })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
