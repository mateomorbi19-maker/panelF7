"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, AlertTriangle } from "lucide-react";
import clsx from "clsx";

export function MessageInput({
  telefono,
  botActivo,
}: {
  telefono: string;
  botActivo: boolean;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  }, [texto]);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const enviar = async () => {
    const mensaje = texto.trim();
    if (!mensaje || enviando) return;

    setEnviando(true);
    setError(null);

    try {
      const res = await fetch("/api/mensajes/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono, mensaje }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al enviar");
      }
      setTexto("");
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al enviar";
      setError(msg);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(null), 3000);
    } finally {
      setEnviando(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  const disabled = texto.trim().length === 0 || enviando;

  return (
    <div className="shrink-0 border-t border-f7border bg-f7panel px-4 py-3">
      {botActivo && (
        <div className="mb-2 px-3 py-2 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-400 flex items-center gap-2">
          <AlertTriangle size={14} strokeWidth={2} />
          El bot está activo. Considerá pausarlo antes de escribir manualmente.
        </div>
      )}
      {error && (
        <div className="mb-2 text-xs text-f7red">{error}</div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Escribí un mensaje..."
          className="flex-1 resize-none rounded-2xl bg-f7panel2 border border-f7border px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-f7red/40 focus:border-f7red max-h-32 overflow-y-auto"
        />
        <button
          onClick={enviar}
          disabled={disabled}
          className={clsx(
            "shrink-0 rounded-full p-2.5 transition active:scale-95",
            disabled
              ? "bg-f7panel2 text-slate-600 cursor-not-allowed"
              : "bg-f7red hover:bg-red-700 text-white shadow-lg shadow-f7red/20"
          )}
          aria-label="Enviar mensaje"
        >
          {enviando ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
