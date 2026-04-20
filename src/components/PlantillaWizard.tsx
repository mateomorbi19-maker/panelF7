"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Trash2,
  Megaphone,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import type { PlantillaBoton } from "@/types/database";
import { WizardSteps } from "@/components/WizardSteps";
import { PlantillaPreview } from "@/components/PlantillaPreview";

type HeaderTipo = "none" | "text" | "image";

type Form = {
  nombre: string;
  categoria: "marketing" | "utility" | "authentication" | "";
  idioma: string;
  headerTipo: HeaderTipo;
  headerContenido: string;
  cuerpo: string;
  footer: string;
  botones: PlantillaBoton[];
};

const INITIAL_FORM: Form = {
  nombre: "",
  categoria: "",
  idioma: "es",
  headerTipo: "none",
  headerContenido: "",
  cuerpo: "",
  footer: "",
  botones: [],
};

const CATEGORIAS = [
  {
    key: "marketing" as const,
    label: "Marketing",
    desc: "Promociones, ofertas y novedades",
    Icon: Megaphone,
  },
  {
    key: "utility" as const,
    label: "Utilidad",
    desc: "Confirmaciones, recordatorios, actualizaciones",
    Icon: Wrench,
  },
  {
    key: "authentication" as const,
    label: "Autenticación",
    desc: "Códigos de verificación",
    Icon: ShieldCheck,
  },
];

function normalizarNombre(v: string) {
  return v
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function siguienteNumeroVariable(cuerpo: string): number {
  const matches = Array.from(cuerpo.matchAll(/\{\{(\d+)\}\}/g)).map((m) =>
    Number(m[1])
  );
  if (matches.length === 0) return 1;
  return Math.max(...matches) + 1;
}

export function PlantillaWizard() {
  const router = useRouter();
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<Form>(INITIAL_FORM);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [validandoNombre, setValidandoNombre] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [plantillaId, setPlantillaId] = useState<string | null>(null);
  const [aprobada, setAprobada] = useState(false);
  const cuerpoRef = useRef<HTMLTextAreaElement>(null);

  const updateForm = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const agregarVariable = () => {
    const textarea = cuerpoRef.current;
    const n = siguienteNumeroVariable(form.cuerpo);
    const ins = `{{${n}}}`;
    if (!textarea) {
      updateForm("cuerpo", form.cuerpo + ins);
      return;
    }
    const start = textarea.selectionStart ?? form.cuerpo.length;
    const end = textarea.selectionEnd ?? form.cuerpo.length;
    const nuevo = form.cuerpo.slice(0, start) + ins + form.cuerpo.slice(end);
    updateForm("cuerpo", nuevo);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + ins.length, start + ins.length);
    }, 0);
  };

  const agregarBoton = () => {
    if (form.botones.length >= 3) return;
    updateForm("botones", [...form.botones, { tipo: "quick_reply", texto: "" }]);
  };

  const quitarBoton = (i: number) =>
    updateForm(
      "botones",
      form.botones.filter((_, idx) => idx !== i)
    );

  const actualizarBoton = (i: number, boton: PlantillaBoton) => {
    const copia = [...form.botones];
    copia[i] = boton;
    updateForm("botones", copia);
  };

  const validarPaso1 = () => {
    const e: Record<string, string> = {};
    if (!form.nombre) e.nombre = "Obligatorio";
    if (!form.categoria) e.categoria = "Seleccioná una categoría";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const validarPaso2 = async () => {
    const e: Record<string, string> = {};
    if (!form.cuerpo.trim()) e.cuerpo = "El cuerpo es obligatorio";
    if (form.headerTipo === "text" && !form.headerContenido.trim())
      e.headerContenido = "Completá el encabezado o cambialo a Ninguno";
    if (form.headerTipo === "image" && !form.headerContenido.trim())
      e.headerContenido = "Pegá la URL de la imagen";
    for (let i = 0; i < form.botones.length; i++) {
      const b = form.botones[i];
      if (!b.texto.trim()) e[`boton_${i}_texto`] = "Falta el texto";
      if (b.tipo === "url" && !b.url?.trim()) e[`boton_${i}_url`] = "Falta la URL";
    }
    if (Object.keys(e).length > 0) {
      setErrores(e);
      return false;
    }
    setValidandoNombre(true);
    try {
      const res = await fetch(`/api/plantillas?nombre=${encodeURIComponent(form.nombre)}`);
      const data = await res.json();
      if (data.plantilla) {
        setErrores({ nombre: "Ya existe una plantilla con ese nombre" });
        return false;
      }
      setErrores({});
      return true;
    } finally {
      setValidandoNombre(false);
    }
  };

  const guardarPlantilla = async () => {
    setGuardando(true);
    try {
      const res = await fetch("/api/plantillas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          categoria: form.categoria,
          idioma: form.idioma,
          header_tipo: form.headerTipo === "none" ? null : form.headerTipo,
          header_contenido: form.headerTipo === "none" ? null : form.headerContenido || null,
          cuerpo: form.cuerpo,
          footer: form.footer || null,
          botones: form.botones,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErrores({ guardar: d.error ?? "Error al guardar" });
        setGuardando(false);
        return;
      }
      const data = await res.json();
      setPlantillaId(data.plantilla.id);
      setGuardando(false);
      setTimeout(async () => {
        await fetch(`/api/plantillas/${data.plantilla.id}/aprobar`, { method: "PATCH" });
        setAprobada(true);
      }, 5000);
    } catch (e: unknown) {
      setErrores({ guardar: e instanceof Error ? e.message : "Error al guardar" });
      setGuardando(false);
    }
  };

  useEffect(() => {
    if (paso === 4 && !plantillaId && !guardando) {
      guardarPlantilla();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso]);

  const siguiente = async () => {
    if (paso === 1) {
      if (validarPaso1()) setPaso(2);
    } else if (paso === 2) {
      if (await validarPaso2()) setPaso(3);
    } else if (paso === 3) {
      setPaso(4);
    }
  };

  const atras = () => {
    if (paso > 1 && paso < 4) setPaso((paso - 1) as 1 | 2 | 3);
  };

  const STEPS = ["Info básica", "Contenido", "Vista previa", "Confirmación"];

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Nueva plantilla</h1>
        <p className="text-sm text-slate-400 mt-1">
          Seguí los pasos para crear una plantilla aprobable por Meta.
        </p>
      </div>

      <WizardSteps steps={STEPS} current={paso} />

      <div className="max-w-2xl mx-auto bg-f7panel border border-f7border rounded-2xl p-6 shadow-xl">
        {paso === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Nombre de la plantilla
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Solo minúsculas, números y guion bajo (_).
              </p>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => updateForm("nombre", normalizarNombre(e.target.value))}
                placeholder="oferta_fundas_abril"
                className="w-full px-3 py-2 bg-f7panel2 border border-f7border rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red"
              />
              <p className="text-xs text-slate-500 mt-1">
                Se guardará como:{" "}
                <span className="font-mono text-slate-300">
                  {form.nombre || "sin_nombre"}
                </span>
              </p>
              {errores.nombre && (
                <p className="text-xs text-f7red mt-1">{errores.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Categoría
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {CATEGORIAS.map(({ key, label, desc, Icon }) => {
                  const selected = form.categoria === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateForm("categoria", key)}
                      className={clsx(
                        "text-left rounded-xl border p-3 transition",
                        selected
                          ? "border-f7red bg-f7red/10 shadow-lg shadow-f7red/10"
                          : "border-f7border bg-f7panel2 hover:border-slate-500"
                      )}
                    >
                      <Icon
                        className={clsx("mb-2", selected ? "text-f7red" : "text-slate-400")}
                        size={20}
                      />
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{desc}</p>
                    </button>
                  );
                })}
              </div>
              {errores.categoria && (
                <p className="text-xs text-f7red mt-1">{errores.categoria}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Idioma
              </label>
              <select
                value={form.idioma}
                onChange={(e) => updateForm("idioma", e.target.value)}
                className="px-3 py-2 bg-f7panel2 border border-f7border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red"
              >
                <option value="es">Español</option>
                <option value="en">Inglés</option>
                <option value="pt">Portugués</option>
              </select>
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Encabezado (opcional)
              </label>
              <div className="flex gap-4 mb-3">
                {(
                  [
                    ["none", "Ninguno"],
                    ["text", "Texto"],
                    ["image", "Imagen"],
                  ] as [HeaderTipo, string][]
                ).map(([val, label]) => (
                  <label key={val} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="headerTipo"
                      value={val}
                      checked={form.headerTipo === val}
                      onChange={() => {
                        updateForm("headerTipo", val);
                        if (val === "none") updateForm("headerContenido", "");
                      }}
                      className="accent-f7red"
                    />
                    <span className="text-sm text-slate-300">{label}</span>
                  </label>
                ))}
              </div>
              {form.headerTipo === "text" && (
                <div>
                  <input
                    type="text"
                    maxLength={60}
                    value={form.headerContenido}
                    onChange={(e) => updateForm("headerContenido", e.target.value)}
                    placeholder="Encabezado corto"
                    className="w-full px-3 py-2 bg-f7panel2 border border-f7border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red"
                  />
                  <p className="text-xs text-slate-500 mt-1 text-right">
                    {form.headerContenido.length} / 60
                  </p>
                </div>
              )}
              {form.headerTipo === "image" && (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={form.headerContenido}
                    onChange={(e) => updateForm("headerContenido", e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-f7panel2 border border-f7border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red"
                  />
                  {form.headerContenido && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.headerContenido}
                      alt="preview"
                      style={{ maxHeight: 200 }}
                      className="rounded-lg border border-f7border object-cover"
                    />
                  )}
                </div>
              )}
              {errores.headerContenido && (
                <p className="text-xs text-f7red mt-1">{errores.headerContenido}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Cuerpo <span className="text-f7red">*</span>
              </label>
              <textarea
                ref={cuerpoRef}
                rows={6}
                maxLength={1024}
                value={form.cuerpo}
                onChange={(e) => updateForm("cuerpo", e.target.value)}
                placeholder="Hola {{1}}, tenemos una oferta para tu {{2}}..."
                className="w-full px-3 py-2 bg-f7panel2 border border-f7border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <button
                  type="button"
                  onClick={agregarVariable}
                  className="text-xs text-f7blue hover:underline inline-flex items-center gap-1"
                >
                  <Plus size={12} /> Agregar variable
                </button>
                <p className="text-xs text-slate-500">
                  {form.cuerpo.length} / 1024
                </p>
              </div>
              {errores.cuerpo && (
                <p className="text-xs text-f7red mt-1">{errores.cuerpo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Pie de página (opcional)
              </label>
              <input
                type="text"
                maxLength={60}
                value={form.footer}
                onChange={(e) => updateForm("footer", e.target.value)}
                className="w-full px-3 py-2 bg-f7panel2 border border-f7border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red"
              />
              <p className="text-xs text-slate-500 mt-1 text-right">
                {form.footer.length} / 60
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-white">
                  Botones (opcional)
                </label>
                <button
                  type="button"
                  onClick={agregarBoton}
                  disabled={form.botones.length >= 3}
                  className="text-xs text-f7blue hover:underline inline-flex items-center gap-1 disabled:opacity-40"
                >
                  <Plus size={12} /> Agregar botón
                </button>
              </div>
              {form.botones.length === 0 && (
                <p className="text-xs text-slate-500">Sin botones. Máximo 3.</p>
              )}
              <div className="space-y-2">
                {form.botones.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 bg-f7panel2 border border-f7border rounded-lg p-2"
                  >
                    <select
                      value={b.tipo}
                      onChange={(e) => {
                        const tipo = e.target.value as "quick_reply" | "url";
                        if (tipo === "url") {
                          actualizarBoton(i, { tipo: "url", texto: b.texto, url: "" });
                        } else {
                          actualizarBoton(i, { tipo: "quick_reply", texto: b.texto });
                        }
                      }}
                      className="px-2 py-1.5 bg-f7panel border border-f7border rounded-md text-white text-xs"
                    >
                      <option value="quick_reply">Respuesta rápida</option>
                      <option value="url">Visitar sitio web</option>
                    </select>
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={b.texto}
                        onChange={(e) =>
                          actualizarBoton(i, { ...b, texto: e.target.value })
                        }
                        placeholder="Texto del botón"
                        className="w-full px-2 py-1.5 bg-f7panel border border-f7border rounded-md text-white text-xs"
                      />
                      {b.tipo === "url" && (
                        <input
                          type="url"
                          value={b.url ?? ""}
                          onChange={(e) =>
                            actualizarBoton(i, { ...b, url: e.target.value } as PlantillaBoton)
                          }
                          placeholder="https://..."
                          className="w-full px-2 py-1.5 bg-f7panel border border-f7border rounded-md text-white text-xs"
                        />
                      )}
                      {errores[`boton_${i}_texto`] && (
                        <p className="text-[10px] text-f7red">{errores[`boton_${i}_texto`]}</p>
                      )}
                      {errores[`boton_${i}_url`] && (
                        <p className="text-[10px] text-f7red">{errores[`boton_${i}_url`]}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => quitarBoton(i)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-f7red hover:bg-f7red/10 transition"
                      aria-label="Quitar botón"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="space-y-6">
            <PlantillaPreview
              headerTipo={form.headerTipo === "none" ? null : form.headerTipo}
              headerContenido={form.headerContenido || null}
              cuerpo={form.cuerpo}
              footer={form.footer || null}
              botones={form.botones}
            />
            <p className="text-sm text-slate-400 text-center">
              Así verá el mensaje el destinatario.
            </p>
          </div>
        )}

        {paso === 4 && (
          <div className="text-center py-8">
            {guardando && !plantillaId ? (
              <>
                <Loader2 className="animate-spin text-f7red mx-auto" size={48} />
                <p className="mt-4 text-slate-300 text-sm">Guardando...</p>
              </>
            ) : !aprobada ? (
              <>
                <Clock className="text-yellow-400 mx-auto" size={56} strokeWidth={1.5} />
                <h3 className="text-white text-lg font-semibold mt-4">
                  Plantilla enviada a revisión
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Meta está revisando tu plantilla (simulado).
                </p>
                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 className="animate-spin" size={14} />
                  Esperando aprobación...
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="text-green-400 mx-auto" size={56} strokeWidth={1.5} />
                <h3 className="text-white text-lg font-semibold mt-4">
                  ¡Plantilla aprobada!
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Ya podés usarla en campañas.
                </p>
                <button
                  onClick={() => router.push("/plantillas")}
                  className="mt-6 inline-flex items-center gap-2 bg-f7red hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg shadow-f7red/20 transition"
                >
                  Ir a plantillas
                </button>
              </>
            )}
            {errores.guardar && (
              <p className="text-xs text-f7red mt-4">{errores.guardar}</p>
            )}
          </div>
        )}

        {paso < 4 && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-f7border">
            <button
              type="button"
              onClick={atras}
              disabled={paso === 1}
              className="text-sm text-slate-300 hover:text-white disabled:opacity-40 px-3 py-2"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={siguiente}
              disabled={
                validandoNombre ||
                (paso === 1 && (!form.nombre || !form.categoria)) ||
                (paso === 2 && !form.cuerpo.trim())
              }
              className="inline-flex items-center gap-2 bg-f7red hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-f7red/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validandoNombre && <Loader2 size={14} className="animate-spin" />}
              {paso === 3 ? "Enviar a aprobación" : "Siguiente"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
