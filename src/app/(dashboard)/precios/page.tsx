"use client";

import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";
import { PriceTable } from "@/components/PriceTable";

type Tab = "fundas_a_medida" | "termoformadas" | "fundas_tipo_tapizado";

const TABS: { id: Tab; label: string }[] = [
  { id: "fundas_a_medida", label: "Fundas a medida" },
  { id: "termoformadas", label: "Alfombras termoformadas" },
  { id: "fundas_tipo_tapizado", label: "Tipo tapizado" },
];

const COLUMNS: Record<Tab, Array<{ key: string; label: string; type?: "text" | "number" | "boolean" }>> = {
  fundas_a_medida: [
    { key: "brand", label: "Marca" },
    { key: "model", label: "Modelo" },
    { key: "price_5plazas_cash", label: "5 plazas efectivo", type: "number" },
    { key: "price_5plazas_transfer", label: "5 plazas transfer", type: "number" },
    { key: "price_2ind_cash", label: "2 ind efectivo", type: "number" },
    { key: "price_2ind_transfer", label: "2 ind transfer", type: "number" },
    { key: "price_7asientos_cash", label: "7 asientos efectivo", type: "number" },
    { key: "price_7asientos_transfer", label: "7 asientos transfer", type: "number" },
    { key: "medidas", label: "Tiene medidas", type: "boolean" },
  ],
  termoformadas: [
    { key: "marca", label: "Marca" },
    { key: "vehiculo_modelo", label: "Modelo" },
    { key: "efectivo", label: "Efectivo", type: "number" },
    { key: "transferencia", label: "Transferencia", type: "number" },
  ],
  fundas_tipo_tapizado: [
    { key: "brand", label: "Marca" },
    { key: "model", label: "Modelo" },
    { key: "price_5plazas_cash", label: "5 plazas efectivo", type: "number" },
    { key: "price_5plazas_transfer", label: "5 plazas transfer", type: "number" },
  ],
};

const BRAND_KEY: Record<Tab, string> = {
  fundas_a_medida: "brand",
  termoformadas: "marca",
  fundas_tipo_tapizado: "brand",
};

export default function PreciosPage() {
  const [tab, setTab] = useState<Tab>("fundas_a_medida");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/precios?table=${tab}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
    setBrandFilter("");
  }, [load]);

  const brandKey = BRAND_KEY[tab];
  const brands = Array.from(
    new Set(
      rows
        .map((r) => r[brandKey])
        .filter((v) => v !== null && v !== undefined && v !== "")
        .map((v) => String(v))
    )
  ).sort((a, b) => a.localeCompare(b, "es"));

  const handleUpsert = async (row: any) => {
    const res = await fetch("/api/precios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: tab, row }),
    });
    if (!res.ok) {
      alert("Error al guardar");
      return;
    }
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este registro?")) return;
    const res = await fetch(`/api/precios?table=${tab}&id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Error al eliminar");
      return;
    }
    await load();
  };

  const filtered = rows.filter((r) => {
    if (brandFilter && String(r[brandKey] ?? "") !== brandFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(r).some(
      (v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 min-w-0 overflow-y-auto p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Precios</h1>
        <p className="text-sm text-slate-400 mt-1">
          Administrá los precios de cada producto. Los cambios impactan al bot al instante.
        </p>
      </div>

      <div className="flex gap-1 mb-5 border-b border-f7border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              "px-4 py-2.5 font-medium transition border-b-2 -mb-px whitespace-nowrap",
              tab === t.id
                ? "border-f7red text-f7red"
                : "border-transparent text-slate-400 hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar modelo..."
            className="w-full pl-10 pr-4 py-2 bg-f7panel2 border border-f7border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red"
          />
        </div>

        <div className="relative">
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="appearance-none pl-10 pr-9 py-2 bg-f7panel2 border border-f7border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red cursor-pointer min-w-[180px]"
          >
            <option value="">Todas las marcas</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {brandFilter && (
          <button
            onClick={() => setBrandFilter("")}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-white border border-f7border rounded-lg hover:bg-white/5 transition"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Limpiar filtro
          </button>
        )}

        <span className="text-sm text-slate-500 ml-auto shrink-0">
          {filtered.length} de {rows.length}
        </span>
      </div>

      {loading ? (
        <div className="bg-f7panel rounded-2xl border border-f7border p-12 text-center text-slate-500">
          Cargando...
        </div>
      ) : (
        <PriceTable
          rows={filtered}
          columns={COLUMNS[tab]}
          onUpsert={handleUpsert}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
