"use client";

import { useState } from "react";
import clsx from "clsx";

type Column = { key: string; label: string; type?: "text" | "number" | "boolean" };

type Props = {
  rows: any[];
  columns: Column[];
  onUpsert: (row: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

const NEW_ROW_ID = "__new__";

const fmtMoney = (n: any) =>
  typeof n === "number" ? "$" + n.toLocaleString("es-AR") : "—";

export function PriceTable({ rows, columns, onUpsert, onDelete }: Props) {
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [draft, setDraft] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const startAdd = () => {
    const base: any = { id: NEW_ROW_ID };
    columns.forEach((c) => {
      base[c.key] = c.type === "boolean" ? false : c.type === "number" ? null : "";
    });
    setDraft(base);
    setEditingId(NEW_ROW_ID);
  };

  const startEdit = (row: any) => {
    setDraft({ ...row });
    setEditingId(row.id);
  };

  const cancel = () => {
    setDraft(null);
    setEditingId(null);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const payload = { ...draft };
      if (payload.id === NEW_ROW_ID) delete payload.id;
      await onUpsert(payload);
      setDraft(null);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: string, value: any) =>
    setDraft((d: any) => ({ ...d, [key]: value }));

  const renderCell = (row: any, c: Column, i: number, editing: boolean) => {
    if (editing) {
      if (c.type === "boolean") {
        return (
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!draft[c.key]}
              onChange={(e) => setField(c.key, e.target.checked)}
              className="w-4 h-4 accent-f7red"
            />
            <span className="text-xs text-slate-400">
              {draft[c.key] ? "Sí" : "No"}
            </span>
          </label>
        );
      }
      if (c.type === "number") {
        return (
          <input
            type="number"
            value={draft[c.key] ?? ""}
            onChange={(e) =>
              setField(c.key, e.target.value === "" ? null : Number(e.target.value))
            }
            className="w-32 px-2 py-1.5 bg-f7black border border-f7red/60 rounded-md text-white font-mono tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-f7red/50 focus:border-f7red transition"
            autoFocus={i === 0}
          />
        );
      }
      return (
        <input
          type="text"
          value={draft[c.key] ?? ""}
          onChange={(e) => setField(c.key, e.target.value)}
          className="w-40 px-2 py-1.5 bg-f7black border border-f7red/60 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-f7red/50 focus:border-f7red transition"
          autoFocus={i === 0}
        />
      );
    }

    const v = row[c.key];
    if (c.type === "boolean") {
      return v ? (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-400">
          ✓
        </span>
      ) : (
        <span className="text-slate-600">—</span>
      );
    }
    if (c.type === "number") {
      return v !== null && v !== undefined ? (
        <span className="font-mono tabular-nums text-slate-200">{fmtMoney(v)}</span>
      ) : (
        <span className="text-slate-600">—</span>
      );
    }
    return v !== null && v !== undefined && v !== "" ? (
      <span className="text-slate-100">{String(v)}</span>
    ) : (
      <span className="text-slate-600">—</span>
    );
  };

  const renderActions = (row: any, editing: boolean) => {
    if (editing) {
      return (
        <div className="inline-flex items-center gap-1">
          <button
            onClick={save}
            disabled={saving}
            title="Guardar"
            className="p-2 rounded-lg bg-f7red text-white shadow-lg shadow-f7red/30 hover:bg-red-700 active:scale-[0.95] transition disabled:opacity-50"
          >
            {saving ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
          <button
            onClick={cancel}
            disabled={saving}
            title="Cancelar"
            className="p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => startEdit(row)}
          title="Editar"
          className="p-2 rounded-lg text-slate-400 hover:bg-f7blue/15 hover:text-f7blue hover:scale-110 active:scale-95 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(row.id)}
          title="Eliminar"
          className="p-2 rounded-lg text-slate-400 hover:bg-f7red/15 hover:text-f7red hover:scale-110 active:scale-95 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>
      </div>
    );
  };

  const renderRow = (row: any, keySuffix: string = "") => {
    const isEditing = editingId === row.id;
    return (
      <tr
        key={String(row.id) + keySuffix}
        className={clsx(
          "group relative transition-all duration-200",
          isEditing
            ? "bg-gradient-to-r from-f7red/10 via-f7red/5 to-transparent shadow-[inset_0_0_0_1px_rgba(230,57,70,0.45),inset_4px_0_0_0_#E63946]"
            : "hover:bg-white/[0.03]"
        )}
      >
        {columns.map((c, i) => (
          <td
            key={c.key}
            className={clsx(
              "px-4 py-3 whitespace-nowrap border-b border-f7border/60 transition-colors",
              i === 0 &&
                (isEditing
                  ? "sticky left-0 bg-[#1a0d10] z-10 font-medium"
                  : "sticky left-0 bg-f7panel group-hover:bg-[#161616] font-medium z-10")
            )}
          >
            {renderCell(row, c, i, isEditing)}
          </td>
        ))}
        <td
          className={clsx(
            "px-4 py-3 text-right whitespace-nowrap border-b border-f7border/60 sticky right-0 transition-colors",
            isEditing ? "bg-[#1a0d10]" : "bg-f7panel group-hover:bg-[#161616]"
          )}
        >
          {renderActions(row, isEditing)}
        </td>
      </tr>
    );
  };

  const addingNew = editingId === NEW_ROW_ID && draft;

  return (
    <div className="bg-f7panel rounded-2xl shadow-xl border border-f7border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-f7border bg-f7panel2/50">
        <span className="text-sm text-slate-400">
          {rows.length} {rows.length === 1 ? "registro" : "registros"}
        </span>
        <button
          onClick={startAdd}
          disabled={editingId !== null}
          className="inline-flex items-center gap-2 px-4 py-2 bg-f7red text-white rounded-lg hover:bg-red-700 active:scale-[0.98] font-semibold text-sm shadow-lg shadow-f7red/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
            <tr className="bg-f7panel2">
              {columns.map((c, i) => (
                <th
                  key={c.key}
                  className={clsx(
                    "px-4 py-3 text-left font-semibold text-slate-300 whitespace-nowrap border-b border-f7border",
                    i === 0 && "sticky left-0 bg-f7panel2 z-20"
                  )}
                >
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-slate-300 whitespace-nowrap border-b border-f7border sticky right-0 bg-f7panel2 z-20">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {addingNew && renderRow(draft, "-new")}
            {rows.length === 0 && !addingNew && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  Sin registros
                </td>
              </tr>
            )}
            {rows.map((row) => renderRow(editingId === row.id ? draft : row))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
