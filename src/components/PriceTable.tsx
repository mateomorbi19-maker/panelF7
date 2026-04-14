"use client";

import { useState } from "react";

type Column = { key: string; label: string; type?: "text" | "number" | "boolean" };

type Props = {
  rows: any[];
  columns: Column[];
  onUpsert: (row: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

const fmtMoney = (n: any) =>
  typeof n === "number" ? "$" + n.toLocaleString("es-AR") : "—";

export function PriceTable({ rows, columns, onUpsert, onDelete }: Props) {
  const [editing, setEditing] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    const newRow: any = {};
    columns.forEach((c) => {
      newRow[c.key] = c.type === "boolean" ? false : c.type === "number" ? null : "";
    });
    setEditing(newRow);
    setAdding(true);
  };

  const openEdit = (row: any) => {
    setEditing({ ...row });
    setAdding(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onUpsert(editing);
      setEditing(null);
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <span className="text-sm text-slate-500">
          {rows.length} {rows.length === 1 ? "registro" : "registros"}
        </span>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-f7red text-white rounded-lg hover:bg-red-700 active:scale-[0.98] font-semibold text-sm shadow-sm transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Agregar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((c, i) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap border-b border-slate-200 ${
                    i === 0 ? "sticky left-0 bg-slate-50 z-10" : ""
                  }`}
                >
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-slate-600 whitespace-nowrap border-b border-slate-200 sticky right-0 bg-slate-50">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  Sin registros
                </td>
              </tr>
            )}
            {rows.map((row, rowIdx) => (
              <tr
                key={row.id}
                className="hover:bg-slate-50/80 group transition-colors"
              >
                {columns.map((c, i) => {
                  const v = row[c.key];
                  let display: React.ReactNode;
                  if (c.type === "boolean") {
                    display = v ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700">✓</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    );
                  } else if (c.type === "number") {
                    display = v !== null && v !== undefined
                      ? <span className="font-mono tabular-nums">{fmtMoney(v)}</span>
                      : <span className="text-slate-300">—</span>;
                  } else {
                    display = v !== null && v !== undefined && v !== ""
                      ? <span className="text-slate-800">{String(v)}</span>
                      : <span className="text-slate-300">—</span>;
                  }
                  return (
                    <td
                      key={c.key}
                      className={`px-4 py-3 whitespace-nowrap border-b border-slate-100 ${
                        i === 0
                          ? "sticky left-0 bg-white group-hover:bg-slate-50/80 font-medium text-slate-900 z-10"
                          : ""
                      }`}
                    >
                      {display}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right whitespace-nowrap border-b border-slate-100 sticky right-0 bg-white group-hover:bg-slate-50/80">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => openEdit(row)}
                      title="Editar"
                      className="p-2 rounded-lg text-slate-500 hover:bg-f7blue/10 hover:text-f7blue transition"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(row.id)}
                      title="Eliminar"
                      className="p-2 rounded-lg text-slate-500 hover:bg-f7red/10 hover:text-f7red transition"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditing(null);
              setAdding(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-f7blue">
                {adding
                  ? "Agregar registro"
                  : `Editar ${editing.brand ?? editing.marca ?? "registro"}`}
              </h2>
              <button
                onClick={() => {
                  setEditing(null);
                  setAdding(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto space-y-4">
              {columns.map((c) => (
                <div key={c.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {c.label}
                  </label>
                  {c.type === "boolean" ? (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!editing[c.key]}
                        onChange={(e) =>
                          setEditing({ ...editing, [c.key]: e.target.checked })
                        }
                        className="w-5 h-5 accent-f7red"
                      />
                      <span className="text-sm text-slate-600">
                        {editing[c.key] ? "Sí" : "No"}
                      </span>
                    </label>
                  ) : c.type === "number" ? (
                    <input
                      type="number"
                      value={editing[c.key] ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          [c.key]:
                            e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red"
                    />
                  ) : (
                    <input
                      type="text"
                      value={editing[c.key] ?? ""}
                      onChange={(e) =>
                        setEditing({ ...editing, [c.key]: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <button
                onClick={() => {
                  setEditing(null);
                  setAdding(false);
                }}
                disabled={saving}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-5 py-2 bg-f7red text-white rounded-lg font-semibold hover:bg-red-700 active:scale-[0.98] shadow-sm transition disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
