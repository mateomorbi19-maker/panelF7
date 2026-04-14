"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import clsx from "clsx";

type Conversation = {
  telefono: string;
  conversation_id: string | null;
  last_content: string | null;
  last_direction: "in" | "out";
  last_at: string;
  message_count: number;
  labels: string[];
};

export function ChatList({ conversations }: { conversations: Conversation[] }) {
  const params = useParams<{ telefono?: string }>();
  const selected = params?.telefono ? decodeURIComponent(params.telefono) : null;
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return conversations;
    const needle = q.toLowerCase();
    return conversations.filter(
      (c) =>
        c.telefono.toLowerCase().includes(needle) ||
        (c.last_content ?? "").toLowerCase().includes(needle) ||
        c.labels.some((l) => l.toLowerCase().includes(needle))
    );
  }, [conversations, q]);

  return (
    <aside className="w-[360px] shrink-0 border-r border-f7border bg-f7panel flex flex-col">
      <div className="p-4 border-b border-f7border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Bandeja de entrada</h2>
          <span className="text-xs text-slate-500">{conversations.length}</span>
        </div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar chat..."
            className="w-full pl-9 pr-3 py-2 bg-f7panel2 border border-f7border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">
            {q ? "Sin resultados" : "No hay conversaciones"}
          </div>
        )}
        {filtered.map((c) => {
          const isActive = selected === c.telefono;
          return (
            <Link
              key={c.telefono}
              href={`/bandeja/${encodeURIComponent(c.telefono)}`}
              className={clsx(
                "block px-4 py-3 border-b border-f7border/60 transition",
                isActive
                  ? "bg-f7red/10 border-l-2 border-l-f7red"
                  : "hover:bg-white/5"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-white text-sm truncate">
                  {c.telefono}
                </span>
                <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                  {new Date(c.last_at).toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                <span className={c.last_direction === "out" ? "text-f7blue" : "text-slate-500"}>
                  {c.last_direction === "out" ? "→ " : "← "}
                </span>
                {c.last_content ?? "[sin contenido]"}
              </p>
              {c.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.labels.map((l) => (
                    <span
                      key={l}
                      className={clsx(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium",
                        l === "bot_disabled"
                          ? "bg-f7red/15 text-f7red"
                          : "bg-f7blue/15 text-f7blue"
                      )}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
