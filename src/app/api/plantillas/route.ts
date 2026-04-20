import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { PlantillaBoton } from "@/types/database";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(req: Request) {
  if (!(await requireUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const nombre = searchParams.get("nombre");
  const estado = searchParams.get("estado");

  const admin = createAdminClient();
  let query = admin.from("plantillas").select("*").order("created_at", { ascending: false });

  if (nombre) query = query.eq("nombre", nombre);
  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (nombre) {
    return NextResponse.json({ plantilla: data?.[0] ?? null });
  }
  return NextResponse.json({ plantillas: data ?? [] });
}

type PlantillaBody = {
  nombre: string;
  categoria: "marketing" | "utility" | "authentication";
  idioma: string;
  header_tipo: "text" | "image" | null;
  header_contenido: string | null;
  cuerpo: string;
  footer: string | null;
  botones: PlantillaBoton[];
};

export async function POST(req: Request) {
  if (!(await requireUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Partial<PlantillaBody> | null;
  if (
    !body ||
    !body.nombre ||
    !body.categoria ||
    !body.cuerpo ||
    typeof body.idioma !== "string"
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const insertRow = {
    nombre: body.nombre,
    categoria: body.categoria,
    idioma: body.idioma,
    header_tipo: body.header_tipo ?? null,
    header_contenido: body.header_contenido ?? null,
    cuerpo: body.cuerpo,
    footer: body.footer ?? null,
    botones: body.botones ?? [],
    estado: "pendiente" as const,
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("plantillas")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plantilla: data });
}
