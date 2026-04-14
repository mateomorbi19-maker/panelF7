"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Config faltante: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY no estan en el bundle.");
      }
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("[login] signIn error:", error);
        setError(error.message || "Credenciales incorrectas");
        setLoading(false);
        return;
      }
      router.push("/bandeja");
      router.refresh();
    } catch (err) {
      console.error("[login] exception:", err);
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
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
          <img src="/logo.svg" alt="F7" className="w-40 h-auto drop-shadow-[0_8px_24px_rgba(47,107,214,0.35)]" />
          <h1 className="mt-6 text-2xl font-bold text-white">Panel F7 Automotriz</h1>
          <p className="text-sm text-slate-400 mt-1">Inicia sesión para continuar</p>
        </div>
        <div className="bg-f7panel border border-f7border rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-f7panel2 border border-f7border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-f7red/50 focus:border-f7red"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-f7panel2 border border-f7border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-f7red/50 focus:border-f7red"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-f7red bg-f7red/10 border border-f7red/30 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-f7red hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50 shadow-lg shadow-f7red/20"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
