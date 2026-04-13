"use client";

import { useState } from "react";

type Column = { key: string; label: string; type?: "text" | "number" | "boolean" };

type Props = {
  rows: any[];
  columns: Column[];
  onUpsert: (row: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

export function PriceTable({ rows, columns, onUpsert, onDelete }: Props) {
  const [editing, setEditing] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);

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
    await onUpsert(editing);
    setEditing(null);
    setAdding(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex justify-end p-3 border-b border-slate-100">
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-f7blue text-white rounded-lg hover:bg-f7blue/90 font-semibold text-sm"
        >
          + Agregar
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
              <th className="px-3 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                    {c.type === "boolean"
                      ? row[c.key]
                        ? "✓"
                        : "—"
                      : row[c.key] !== null && row[c.key] !== undefined
                      ? String(row[c.key])
                      : "—"}
                  </td>
                ))}
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => openEdit(row)}
                    className="text-f7blue hover:underline text-xs mr-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(row.id)}
                    className="text-f7red hover:underline text-xs"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-f7blue mb-4">
              {adding ? "Agregar registro" : `Editar ${editing.brand ?? editing.marca ?? "registro"}`}
            </h2>
            <div className="space-y-3">
              {columns.map((c) => (
                <div key={c.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {c.label}
                  </label>
                  {c.type === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={!!editing[c.key]}
                      onChange={(e) =>
                        setEditing({ ...editing, [c.key]: e.target.checked })
                      }
                    />
                  ) : c.type === "number" ? (
                    <input
                      type="number"
                      value={editing[c.key] ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          [c.key]: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  ) : (
                    <input
                      type="text"
                      value={editing[c.key] ?? ""}
                      onChange={(e) => setEditing({ ...editing, [c.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setEditing(null);
                  setAdding(false);
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                className="px-4 py-2 bg-f7red text-white rounded-lg font-semibold hover:bg-red-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
