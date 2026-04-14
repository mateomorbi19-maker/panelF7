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
        throw new Error("Config faltante: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY no estan en el bundle. EasyPanel necesita pasarlas como Build Args.");
      }
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("[login] signIn error:", error);
        setError(error.message || "Credenciales incorrectas");
        setLoading(false);
        return;
      }
      router.push("/conversaciones");
      router.refresh();
    } catch (err) {
      console.error("[login] exception:", err);
      setError("Error de conexión: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-f7dark via-f7blue to-f7red p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="F7" className="w-24 h-24 mb-4" />
          <h1 className="text-2xl font-bold text-f7blue">Panel F7 Automotriz</h1>
          <p className="text-sm text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-f7red"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-f7red"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-f7red">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-f7red hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
