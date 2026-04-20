"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquarePlus, Users, Search } from "lucide-react";
import type { ContactoRow } from "@/types/database";

type Tipo = "todos" | "cliente" | "lead_calificado";

export function ContactosTable({ contactos }: { contactos: ContactoRow[] }) {
  const router = useRouter();
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<Tipo>("todos");
  const [filtroEtiqueta, setFiltroEtiqueta] = useState<string | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const etiquetasUnicas = useMemo(
    () =>
      Array.from(new Set(contactos.flatMap((c) => c.etiquetas ?? []))).sort((a, b) =>
        a.localeCompare(b, "es")
      ),
    [contactos]
  );

  const filtrados = useMemo(() => {
    const q = filtroTexto.trim().toLowerCase();
    return contactos.filter((c) => {
      if (filtroTipo !== "todos" && c.tipo !== filtroTipo) return false;
      if (filtroEtiqueta && !c.etiquetas.includes(filtroEtiqueta)) return false;
      if (!q) return true;
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [contactos, filtroTexto, filtroTipo, filtroEtiqueta]);

  const filtradosIds = useMemo(() => filtrados.map((c) => c.id), [filtrados]);
  const allSelected =
    filtradosIds.length > 0 && filtradosIds.every((id) => seleccionados.has(id));
  const someSelected =
    filtradosIds.some((id) => seleccionados.has(id)) && !allSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const toggleAll = () => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filtradosIds.forEach((id) => next.delete(id));
      } else {
        filtradosIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const limpiarFiltros = () => {
    setFiltroTexto("");
    setFiltroTipo("todos");
    setFiltroEtiqueta(null);
  };

  const iniciarConversacion = () => {
    sessionStorage.setItem(
      "campana_contactos_seleccionados",
      JSON.stringify([...seleccionados])
    );
    router.push("/campanas/nueva");
  };

  const n = seleccionados.size;

  if (contactos.length === 0) {
    return (
      <div className="bg-f7panel rounded-2xl border border-f7border p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-f7panel2 border border-f7border mb-4">
          <Users className="text-slate-500" size={28} strokeWidth={1.5} />
        </div>
        <h3 className="text-white font-semibold mb-1">No hay contactos aún</h3>
        <p className="text-sm text-slate-400">
          Ejecutá el seed desde{" "}
          <code className="text-f7red bg-f7panel2 px-1.5 py-0.5 rounded border border-f7border">
            /api/seed/contactos
          </code>
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={18}
            strokeWidth={2}
          />
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar por nombre, teléfono o email..."
            className="w-full pl-10 pr-4 py-2 bg-f7panel2 border border-f7border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red"
          />
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as Tipo)}
          className="px-3 py-2 bg-f7panel2 border border-f7border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red cursor-pointer"
        >
          <option value="todos">Todos los tipos</option>
          <option value="cliente">Cliente</option>
          <option value="lead_calificado">Lead calificado</option>
        </select>

        <select
          value={filtroEtiqueta ?? ""}
          onChange={(e) => setFiltroEtiqueta(e.target.value || null)}
          className="px-3 py-2 bg-f7panel2 border border-f7border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red cursor-pointer"
        >
          <option value="">Todas las etiquetas</option>
          {etiquetasUnicas.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>

        <span className="text-sm text-slate-500 ml-auto shrink-0">
          {filtrados.length} de {contactos.length}
        </span>
      </div>

      {/* Tabla */}
      <div className="bg-f7panel rounded-2xl border border-f7border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-f7panel2 sticky top-0 z-10">
                <th className="px-4 py-3 text-left border-b border-f7border w-10">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-f7red cursor-pointer"
                  />
                </th>
                {[
                  "Nombre",
                  "Teléfono",
                  "Tipo",
                  "Vehículo",
                  "Ciudad",
                  "Etiquetas",
                  "Última interacción",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold text-slate-300 whitespace-nowrap border-b border-f7border"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <p className="mb-3">No se encontraron contactos con estos filtros</p>
                    <button
                      onClick={limpiarFiltros}
                      className="text-sm text-f7red hover:underline"
                    >
                      Limpiar filtros
                    </button>
                  </td>
                </tr>
              ) : (
                filtrados.map((c) => {
                  const checked = seleccionados.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => toggleOne(c.id)}
                      className={clsx(
                        "cursor-pointer transition-colors",
                        checked ? "bg-f7red/5" : "hover:bg-white/[0.03]"
                      )}
                    >
                      <td
                        className="px-4 py-3 border-b border-f7border/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(c.id)}
                          className="w-4 h-4 accent-f7red cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-f7border/60 text-white font-medium whitespace-nowrap">
                        {c.nombre}
                      </td>
                      <td className="px-4 py-3 border-b border-f7border/60 text-slate-300 font-mono text-xs whitespace-nowrap">
                        {c.telefono}
                      </td>
                      <td className="px-4 py-3 border-b border-f7border/60 whitespace-nowrap">
                        <span
                          className={clsx(
                            "text-xs rounded-full px-2 py-0.5 font-medium",
                            c.tipo === "cliente"
                              ? "bg-green-500/15 text-green-400"
                              : "bg-yellow-500/15 text-yellow-400"
                          )}
                        >
                          {c.tipo === "cliente" ? "Cliente" : "Lead"}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-f7border/60 text-slate-300 whitespace-nowrap">
                        {c.vehiculo ?? <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 border-b border-f7border/60 text-slate-300 whitespace-nowrap">
                        {c.ciudad ?? <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 border-b border-f7border/60">
                        {c.etiquetas.length === 0 ? (
                          <span className="text-slate-600">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {c.etiquetas.map((e) => (
                              <span
                                key={e}
                                className="text-xs rounded-full px-2 py-0.5 bg-f7panel2 text-slate-300 border border-f7border"
                              >
                                {e}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b border-f7border/60 whitespace-nowrap text-xs">
                        {c.ultima_interaccion ? (
                          <span className="text-slate-400">
                            hace{" "}
                            {formatDistanceToNow(new Date(c.ultima_interaccion), {
                              locale: es,
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">Sin interacción</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Placeholder bottom spacer para barra fija */}
      {n > 0 && <div className="h-24" />}

      {/* Barra de acción sticky */}
      <div
        className={clsx(
          "fixed bottom-0 inset-x-0 md:left-64 z-20 transition-all duration-200",
          n > 0
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-f7panel border-t border-f7border shadow-[0_-8px_24px_rgba(0,0,0,0.5)] px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-white">
            <span className="font-semibold">{n}</span> contacto{n > 1 ? "s" : ""}{" "}
            seleccionado{n > 1 ? "s" : ""}
          </span>
          <button
            onClick={iniciarConversacion}
            className="inline-flex items-center gap-2 bg-f7red hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-f7red/20 transition active:scale-[0.98]"
          >
            <MessageSquarePlus size={18} strokeWidth={2} />
            Iniciar conversación
          </button>
        </div>
      </div>
    </>
  );
}
