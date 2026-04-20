"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CheckCircle2, Users, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type {
  ContactoRow,
  PlantillaRow,
  VariableMapeo,
} from "@/types/database";
import { WizardSteps } from "@/components/WizardSteps";
import { PlantillaPreview } from "@/components/PlantillaPreview";

type Origen = VariableMapeo["origen"];

const ORIGEN_LABELS: Record<Origen, string> = {
  nombre: "Nombre del contacto",
  vehiculo: "Vehículo",
  ciudad: "Ciudad",
  texto_fijo: "Texto fijo",
};

const SIN_VALOR: Record<Origen, string> = {
  nombre: "[sin nombre]",
  vehiculo: "[sin vehículo]",
  ciudad: "[sin ciudad]",
  texto_fijo: "[sin texto]",
};

function extraerVariables(cuerpo: string): number[] {
  const nums = new Set<number>();
  const re = /\{\{(\d+)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cuerpo)) !== null) nums.add(Number(m[1]));
  return Array.from(nums).sort((a, b) => a - b);
}

function valorParaContacto(
  origen: Origen,
  c: ContactoRow | null,
  valor: string | undefined
): string {
  if (origen === "texto_fijo") return (valor ?? "").trim() || SIN_VALOR.texto_fijo;
  if (!c) return SIN_VALOR[origen];
  if (origen === "nombre") return c.nombre || SIN_VALOR.nombre;
  if (origen === "vehiculo") return c.vehiculo || SIN_VALOR.vehiculo;
  if (origen === "ciudad") return c.ciudad || SIN_VALOR.ciudad;
  return "";
}

function renderizarCuerpo(
  cuerpo: string,
  mapeo: Record<string, VariableMapeo>,
  contacto: ContactoRow | null
): string {
  return cuerpo.replace(/\{\{(\d+)\}\}/g, (_m, n) => {
    const map = mapeo[n];
    if (!map) return `{{${n}}}`;
    return valorParaContacto(map.origen, contacto, map.valor);
  });
}

export function CampanaWizard() {
  const router = useRouter();
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [contactosSel, setContactosSel] = useState<ContactoRow[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaRow[]>([]);
  const [plantillaId, setPlantillaId] = useState<string>("");
  const [mapeo, setMapeo] = useState<Record<string, VariableMapeo>>({});
  const [nombreCampana, setNombreCampana] = useState(
    `Campaña ${format(new Date(), "dd/MM/yyyy HH:mm")}`
  );
  const [cargandoInit, setCargandoInit] = useState(true);
  const [mostrarPreviewModal, setMostrarPreviewModal] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [completada, setCompletada] = useState(false);
  const [campanaId, setCampanaId] = useState<string | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const initRun = useRef(false);

  useEffect(() => {
    if (initRun.current) return;
    initRun.current = true;
    (async () => {
      try {
        const raw = typeof window !== "undefined"
          ? sessionStorage.getItem("campana_contactos_seleccionados")
          : null;
        const ids: string[] = raw ? JSON.parse(raw) : [];
        const [resPlantillas, resContactos] = await Promise.all([
          fetch("/api/plantillas?estado=aprobada").then((r) => r.json()),
          ids.length > 0
            ? fetch(`/api/contactos?ids=${encodeURIComponent(ids.join(","))}`).then(
                (r) => r.json()
              )
            : Promise.resolve({ contactos: [] }),
        ]);
        setPlantillas(resPlantillas.plantillas ?? []);
        setContactosSel(resContactos.contactos ?? []);
      } finally {
        setCargandoInit(false);
      }
    })();
  }, []);

  const plantilla = useMemo(
    () => plantillas.find((p) => p.id === plantillaId) ?? null,
    [plantillas, plantillaId]
  );
  const variables = useMemo(
    () => (plantilla ? extraerVariables(plantilla.cuerpo) : []),
    [plantilla]
  );

  // Reset del mapeo cuando cambia la plantilla
  useEffect(() => {
    if (!plantilla) {
      setMapeo({});
      return;
    }
    const nuevo: Record<string, VariableMapeo> = {};
    variables.forEach((n) => {
      nuevo[String(n)] = mapeo[String(n)] ?? { origen: "nombre" };
    });
    setMapeo(nuevo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantillaId]);

  const puedeAvanzarPaso2 = useMemo(() => {
    if (!plantilla) return false;
    return variables.every((n) => {
      const m = mapeo[String(n)];
      if (!m) return false;
      if (m.origen === "texto_fijo") return (m.valor ?? "").trim().length > 0;
      return true;
    });
  }, [plantilla, variables, mapeo]);

  const quitarContacto = (id: string) =>
    setContactosSel((cs) => cs.filter((c) => c.id !== id));

  const limpiarTodos = () => setContactosSel([]);

  const enviarCampana = async () => {
    if (!plantilla) return;
    setEnviando(true);
    setErrorEnvio(null);
    setProgreso(0);

    try {
      const resCrear = await fetch("/api/campanas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreCampana,
          plantilla_id: plantilla.id,
          variables_mapeo: mapeo,
          contactos_ids: contactosSel.map((c) => c.id),
        }),
      });
      if (!resCrear.ok) {
        const d = await resCrear.json().catch(() => ({}));
        throw new Error(d.error ?? "No se pudo crear la campaña");
      }
      const { id } = await resCrear.json();
      setCampanaId(id);

      const total = contactosSel.length;
      for (let i = 0; i < total; i++) {
        await new Promise((r) => setTimeout(r, 150));
        const enviados = i + 1;
        setProgreso(enviados);
        if (enviados % 5 === 0 || enviados === total) {
          await fetch(`/api/campanas/${id}/progreso`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enviados }),
          });
        }
      }

      await fetch(`/api/campanas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "completada",
          completada_at: new Date().toISOString(),
        }),
      });

      sessionStorage.removeItem("campana_contactos_seleccionados");
      setCompletada(true);
    } catch (e: unknown) {
      setErrorEnvio(e instanceof Error ? e.message : "Error en el envío");
    } finally {
      setEnviando(false);
    }
  };

  const STEPS = ["Destinatarios", "Mensaje", "Enviar"];

  const previewPrimerContacto = plantilla
    ? renderizarCuerpo(plantilla.cuerpo, mapeo, contactosSel[0] ?? null)
    : "";

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Nueva campaña</h1>
        <p className="text-sm text-slate-400 mt-1">
          Enviá un mensaje masivo a los contactos seleccionados.
        </p>
      </div>

      <WizardSteps steps={STEPS} current={paso} />

      <div className="max-w-3xl mx-auto bg-f7panel border border-f7border rounded-2xl p-6 shadow-xl">
        {cargandoInit ? (
          <div className="py-12 flex items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mr-2" size={18} /> Cargando...
          </div>
        ) : (
          <>
            {paso === 1 && (
              <Paso1
                contactos={contactosSel}
                onQuitar={quitarContacto}
                onLimpiar={limpiarTodos}
              />
            )}

            {paso === 2 && (
              <Paso2
                plantillas={plantillas}
                plantillaId={plantillaId}
                onChangePlantilla={setPlantillaId}
                plantilla={plantilla}
                variables={variables}
                mapeo={mapeo}
                onMapeoChange={setMapeo}
                onVerConDatosReales={() => setMostrarPreviewModal(true)}
                contactosSel={contactosSel}
              />
            )}

            {paso === 3 && (
              <Paso3
                plantilla={plantilla!}
                contactosSel={contactosSel}
                nombreCampana={nombreCampana}
                onNombreChange={setNombreCampana}
                enviando={enviando}
                progreso={progreso}
                completada={completada}
                errorEnvio={errorEnvio}
                previewPrimero={previewPrimerContacto}
                onEnviar={enviarCampana}
                campanaId={campanaId}
              />
            )}
          </>
        )}

        {paso < 3 && !cargandoInit && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-f7border">
            <button
              type="button"
              onClick={() => setPaso((p) => (p > 1 ? ((p - 1) as 1 | 2) : p))}
              disabled={paso === 1}
              className="text-sm text-slate-300 hover:text-white disabled:opacity-40 px-3 py-2"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setPaso((p) => (p + 1) as 2 | 3)}
              disabled={
                (paso === 1 && contactosSel.length === 0) ||
                (paso === 2 && !puedeAvanzarPaso2)
              }
              className="inline-flex items-center gap-2 bg-f7red hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-f7red/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {mostrarPreviewModal && plantilla && (
        <PreviewConDatosModal
          plantilla={plantilla}
          mapeo={mapeo}
          contactos={contactosSel.slice(0, 3)}
          onClose={() => setMostrarPreviewModal(false)}
        />
      )}
    </div>
  );
}

function Paso1({
  contactos,
  onQuitar,
  onLimpiar,
}: {
  contactos: ContactoRow[];
  onQuitar: (id: string) => void;
  onLimpiar: () => void;
}) {
  if (contactos.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-f7panel2 border border-f7border mb-4">
          <Users className="text-slate-500" size={28} strokeWidth={1.5} />
        </div>
        <h3 className="text-white font-semibold mb-1">No seleccionaste contactos</h3>
        <p className="text-sm text-slate-400 mb-5">
          Primero elegí los destinatarios desde la sección de contactos.
        </p>
        <a
          href="/contactos"
          className="inline-flex items-center gap-2 bg-f7red hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg shadow-f7red/20 transition"
        >
          Ir a contactos
        </a>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-white font-semibold">
          {contactos.length} destinatario{contactos.length > 1 ? "s" : ""}
        </p>
        <button
          onClick={onLimpiar}
          className="text-xs text-slate-400 hover:text-white"
        >
          Limpiar todo
        </button>
      </div>
      <div className="rounded-lg border border-f7border overflow-hidden max-h-96 overflow-y-auto">
        {contactos.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between px-4 py-3 border-b border-f7border/60 last:border-b-0 bg-f7panel2"
          >
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{c.nombre}</p>
              <p className="text-xs text-slate-400 font-mono truncate">{c.telefono}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={clsx(
                  "text-[10px] rounded-full px-2 py-0.5 font-medium",
                  c.tipo === "cliente"
                    ? "bg-green-500/15 text-green-400"
                    : "bg-yellow-500/15 text-yellow-400"
                )}
              >
                {c.tipo === "cliente" ? "Cliente" : "Lead"}
              </span>
              <button
                onClick={() => onQuitar(c.id)}
                className="p-1.5 rounded text-slate-400 hover:text-f7red hover:bg-f7red/10 transition"
                aria-label="Quitar"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Paso2({
  plantillas,
  plantillaId,
  onChangePlantilla,
  plantilla,
  variables,
  mapeo,
  onMapeoChange,
  onVerConDatosReales,
  contactosSel,
}: {
  plantillas: PlantillaRow[];
  plantillaId: string;
  onChangePlantilla: (id: string) => void;
  plantilla: PlantillaRow | null;
  variables: number[];
  mapeo: Record<string, VariableMapeo>;
  onMapeoChange: (m: Record<string, VariableMapeo>) => void;
  onVerConDatosReales: () => void;
  contactosSel: ContactoRow[];
}) {
  const actualizar = (n: number, patch: Partial<VariableMapeo>) => {
    const k = String(n);
    onMapeoChange({
      ...mapeo,
      [k]: { ...mapeo[k], ...patch } as VariableMapeo,
    });
  };

  const preview = plantilla
    ? (() => {
        const primer = contactosSel[0] ?? null;
        return plantilla.cuerpo.replace(/\{\{(\d+)\}\}/g, (_m, num) => {
          const map = mapeo[num];
          if (!map) return `{{${num}}}`;
          return valorParaContacto(map.origen, primer, map.valor);
        });
      })()
    : "";

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-white mb-1">
          Elegir plantilla
        </label>
        {plantillas.length === 0 ? (
          <p className="text-xs text-slate-400">
            No hay plantillas aprobadas. Creá una desde{" "}
            <a href="/plantillas/nueva" className="text-f7red hover:underline">
              Plantillas
            </a>
            .
          </p>
        ) : (
          <select
            value={plantillaId}
            onChange={(e) => onChangePlantilla(e.target.value)}
            className="w-full px-3 py-2 bg-f7panel2 border border-f7border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red"
          >
            <option value="">Seleccioná una plantilla</option>
            {plantillas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {plantilla && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-white">Mapeo de variables</p>
            {variables.length === 0 ? (
              <p className="text-xs text-slate-400">
                Esta plantilla no tiene variables.
              </p>
            ) : (
              variables.map((n) => {
                const k = String(n);
                const m = mapeo[k] ?? { origen: "nombre" };
                return (
                  <div
                    key={n}
                    className="border border-f7border rounded-lg p-3 bg-f7panel2"
                  >
                    <label className="block text-xs font-semibold text-white mb-2">
                      Variable {"{{" + n + "}}"}
                    </label>
                    <select
                      value={m.origen}
                      onChange={(e) =>
                        actualizar(n, { origen: e.target.value as Origen, valor: "" })
                      }
                      className="w-full px-2 py-1.5 bg-f7panel border border-f7border rounded-md text-white text-xs"
                    >
                      {(Object.keys(ORIGEN_LABELS) as Origen[]).map((o) => (
                        <option key={o} value={o}>
                          {ORIGEN_LABELS[o]}
                        </option>
                      ))}
                    </select>
                    {m.origen === "texto_fijo" && (
                      <input
                        type="text"
                        value={m.valor ?? ""}
                        onChange={(e) => actualizar(n, { valor: e.target.value })}
                        placeholder="Texto a usar"
                        className="mt-2 w-full px-2 py-1.5 bg-f7panel border border-f7border rounded-md text-white text-xs"
                      />
                    )}
                  </div>
                );
              })
            )}
            <button
              type="button"
              onClick={onVerConDatosReales}
              disabled={contactosSel.length === 0}
              className="text-xs text-f7blue hover:underline disabled:opacity-40"
            >
              Ver con datos reales
            </button>
          </div>

          <div>
            <p className="text-sm font-medium text-white mb-2">Vista previa</p>
            <PlantillaPreview
              headerTipo={plantilla.header_tipo}
              headerContenido={plantilla.header_contenido}
              cuerpo={plantilla.cuerpo}
              footer={plantilla.footer}
              botones={plantilla.botones}
              size="sm"
              renderedCuerpo={preview}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Paso3({
  plantilla,
  contactosSel,
  nombreCampana,
  onNombreChange,
  enviando,
  progreso,
  completada,
  errorEnvio,
  previewPrimero,
  onEnviar,
  campanaId,
}: {
  plantilla: PlantillaRow;
  contactosSel: ContactoRow[];
  nombreCampana: string;
  onNombreChange: (v: string) => void;
  enviando: boolean;
  progreso: number;
  completada: boolean;
  errorEnvio: string | null;
  previewPrimero: string;
  onEnviar: () => void;
  campanaId: string | null;
}) {
  const router = useRouter();
  const total = contactosSel.length;
  const pct = total > 0 ? Math.round((progreso / total) * 100) : 0;

  if (completada) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="text-green-400 mx-auto" size={56} strokeWidth={1.5} />
        <h3 className="text-white text-lg font-semibold mt-4">¡Campaña enviada!</h3>
        <p className="text-sm text-slate-400 mt-1">
          {total} mensajes enviados • 0 fallidos
        </p>
        <button
          onClick={() => router.push("/campanas")}
          className="mt-6 inline-flex items-center gap-2 bg-f7red hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg shadow-f7red/20 transition"
        >
          Ver campañas
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-white mb-1">
          Nombre de la campaña
        </label>
        <input
          type="text"
          value={nombreCampana}
          onChange={(e) => onNombreChange(e.target.value)}
          disabled={enviando}
          className="w-full px-3 py-2 bg-f7panel2 border border-f7border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red disabled:opacity-60"
        />
      </div>

      <div className="bg-f7panel2 border border-f7border rounded-lg p-4 space-y-2 text-sm">
        <p className="text-slate-300">
          <span className="text-slate-500">Plantilla:</span>{" "}
          <span className="font-mono text-white">{plantilla.nombre}</span>
        </p>
        <p className="text-slate-300">
          <span className="text-slate-500">Destinatarios:</span>{" "}
          <span className="text-white font-semibold">{total}</span>
        </p>
        <div>
          <p className="text-slate-500 mb-1">Vista previa (primer contacto):</p>
          <div className="bg-f7panel rounded border border-f7border p-3 text-xs text-slate-200 whitespace-pre-wrap">
            {previewPrimero}
          </div>
        </div>
      </div>

      {enviando ? (
        <div className="space-y-2">
          <div className="w-full h-3 rounded-full bg-f7panel2 overflow-hidden border border-f7border">
            <div
              className="h-full bg-green-500 transition-all duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-sm text-slate-400 text-center">
            {progreso} de {total} enviados
          </p>
        </div>
      ) : (
        <button
          onClick={onEnviar}
          disabled={total === 0 || !!campanaId}
          className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold shadow-lg shadow-green-600/20 transition disabled:opacity-50"
        >
          Enviar campaña a {total} contacto{total > 1 ? "s" : ""}
        </button>
      )}

      {errorEnvio && <p className="text-xs text-f7red">{errorEnvio}</p>}
    </div>
  );
}

function PreviewConDatosModal({
  plantilla,
  mapeo,
  contactos,
  onClose,
}: {
  plantilla: PlantillaRow;
  mapeo: Record<string, VariableMapeo>;
  contactos: ContactoRow[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-f7panel border border-f7border rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Vista previa con datos reales</h3>
            <p className="text-xs text-slate-400">
              Mostrando los primeros {contactos.length} contacto
              {contactos.length > 1 ? "s" : ""}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contactos.map((c) => {
            const rendered = plantilla.cuerpo.replace(
              /\{\{(\d+)\}\}/g,
              (_m, num) => {
                const map = mapeo[num];
                if (!map) return `{{${num}}}`;
                return valorParaContacto(map.origen, c, map.valor);
              }
            );
            return (
              <div key={c.id}>
                <p className="text-xs text-slate-400 mb-2 text-center truncate">
                  {c.nombre} · {c.telefono}
                </p>
                <PlantillaPreview
                  headerTipo={plantilla.header_tipo}
                  headerContenido={plantilla.header_contenido}
                  cuerpo={plantilla.cuerpo}
                  footer={plantilla.footer}
                  botones={plantilla.botones}
                  size="sm"
                  renderedCuerpo={rendered}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
