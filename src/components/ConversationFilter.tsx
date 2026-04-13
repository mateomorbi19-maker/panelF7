"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import clsx from "clsx";

export function ConversationFilter({ labels }: { labels: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const currentLabel = params.get("label");

  const update = (next: { label?: string | null; q?: string | null }) => {
    const u = new URLSearchParams(params.toString());
    if (next.label === null) u.delete("label");
    else if (next.label !== undefined) u.set("label", next.label);
    if (next.q === null) u.delete("q");
    else if (next.q !== undefined) u.set("q", next.q);
    startTransition(() => router.push(`/conversaciones?${u.toString()}`));
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") update({ q: q || null });
        }}
        placeholder="Buscar por teléfono o contenido..."
        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-f7red"
      />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => update({ label: null })}
          className={clsx(
            "px-3 py-1 text-sm rounded-full border transition",
            !currentLabel
              ? "bg-f7blue text-white border-f7blue"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          )}
        >
          Todas
        </button>
        {labels.map((label) => (
          <button
            key={label}
            onClick={() => update({ label })}
            className={clsx(
              "px-3 py-1 text-sm rounded-full border transition",
              currentLabel === label
                ? "bg-f7red text-white border-f7red"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {isPending && <p className="text-xs text-slate-400">Cargando...</p>}
    </div>
  );
}
