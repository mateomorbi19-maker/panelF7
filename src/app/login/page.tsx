"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserKey = "mateo" | "alan" | "melanie";

const USERS: { key: UserKey; name: string; color: string; initials: string }[] = [
  { key: "mateo", name: "Mateo", color: "from-f7red to-red-900", initials: "M" },
  { key: "alan", name: "Alan", color: "from-f7blue to-f7bluedark", initials: "A" },
  { key: "melanie", name: "Melanie", color: "from-fuchsia-600 to-purple-900", initials: "Me" },
];

export default function LoginPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState<UserKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectUser = async (user: UserKey) => {
    setLoadingUser(user);
    setError(null);
    try {
      const res = await fetch("/api/auth/select-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo iniciar sesión");
      }
      router.push("/bandeja");
      router.refresh();
    } catch (err) {
      console.error("[login] exception:", err);
      setError(err instanceof Error ? err.message : String(err));
      setLoadingUser(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-f7black p-4 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(47,107,214,0.18), transparent 60%), radial-gradient(ellipse at bottom, rgba(230,57,70,0.15), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.svg"
            alt="F7"
            className="w-36 h-auto drop-shadow-[0_8px_24px_rgba(47,107,214,0.35)]"
          />
          <h1 className="mt-6 text-2xl font-bold text-white">Panel F7 Automotriz</h1>
          <p className="text-sm text-slate-400 mt-1">¿Quién sos?</p>
        </div>

        <div className="space-y-3">
          {USERS.map((u) => {
            const loading = loadingUser === u.key;
            const anyLoading = loadingUser !== null;
            return (
              <button
                key={u.key}
                onClick={() => selectUser(u.key)}
                disabled={anyLoading}
                className={`group w-full flex items-center gap-4 p-4 bg-f7panel border border-f7border rounded-2xl shadow-lg hover:shadow-2xl hover:border-white/20 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                  loading ? "ring-2 ring-f7red/60" : ""
                }`}
              >
                <div
                  className={`w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br ${u.color} flex items-center justify-center text-white font-bold text-xl shadow-inner shadow-black/30`}
                >
                  {u.initials}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-semibold text-lg">{u.name}</p>
                  <p className="text-xs text-slate-500">
                    {loading ? "Ingresando..." : "Tocar para entrar"}
                  </p>
                </div>
                <svg
                  className={`text-slate-500 group-hover:text-white transition-transform ${
                    loading ? "animate-pulse" : "group-hover:translate-x-1"
                  }`}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 text-sm text-f7red bg-f7red/10 border border-f7red/30 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <p className="mt-8 text-center text-[11px] text-slate-600">
          Panel interno F7 Automotriz
        </p>
      </div>
    </div>
  );
}
