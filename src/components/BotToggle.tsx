"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export function BotToggle({
  conversationId,
  initiallyDisabled,
}: {
  conversationId: string;
  initiallyDisabled: boolean;
}) {
  const [disabled, setDisabled] = useState(initiallyDisabled);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = async () => {
    const action = disabled ? "remove" : "add";
    const res = await fetch("/api/chatwoot/label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId, label: "bot_disabled", action }),
    });
    if (!res.ok) {
      alert("Error al cambiar el estado del bot");
      return;
    }
    setDisabled(!disabled);
    startTransition(() => router.refresh());
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={clsx(
        "px-4 py-2 rounded-lg font-semibold text-sm transition",
        disabled
          ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
          : "bg-f7red text-white hover:bg-red-700",
        isPending && "opacity-50"
      )}
    >
      {disabled ? "🔴 Bot pausado — Reactivar" : "🟢 Bot activo — Pausar"}
    </button>
  );
}
