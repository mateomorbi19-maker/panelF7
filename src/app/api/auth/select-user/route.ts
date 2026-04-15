import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const USERS: Record<string, { email: string; passEnv: string }> = {
  mateo: { email: "mateo@f7-automotriz.com", passEnv: "PASS_MATEO" },
  alan: { email: "alan@f7-automotriz.com", passEnv: "PASS_ALAN" },
  melanie: { email: "melanie@f7-automotriz.com", passEnv: "PASS_MELANIE" },
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const user = String(body.user ?? "").toLowerCase();
  const cfg = USERS[user];
  if (!cfg) {
    return NextResponse.json({ error: "Usuario invalido" }, { status: 400 });
  }
  const password = process.env[cfg.passEnv];
  if (!password) {
    return NextResponse.json(
      { error: `Config faltante: ${cfg.passEnv} no esta cargada en el servidor.` },
      { status: 500 }
    );
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email: cfg.email,
    password,
  });

  if (error) {
    console.error("[select-user] signIn error:", error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
