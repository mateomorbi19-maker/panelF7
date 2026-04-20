import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { VariableMapeo } from "@/types/database";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    nombre?: string;
    plantilla_id?: string;
    variables_mapeo?: Record<string, VariableMapeo>;
    contactos_ids?: string[];
  } | null;

  if (
    !body ||
    !body.nombre ||
    !body.plantilla_id ||
    !Array.isArray(body.contactos_ids) ||
    body.contactos_ids.length === 0
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: campana, error: campanaError } = await admin
    .from("campanas")
    .insert({
      nombre: body.nombre,
      plantilla_id: body.plantilla_id,
      variables_mapeo: body.variables_mapeo ?? {},
      total_contactos: body.contactos_ids.length,
      enviados: 0,
      fallidos: 0,
      estado: "enviando",
    })
    .select("*")
    .single();

  if (campanaError || !campana) {
    return NextResponse.json(
      { error: campanaError?.message ?? "error creando campaña" },
      { status: 500 }
    );
  }

  const filas = body.contactos_ids.map((cid) => ({
    campana_id: campana.id,
    contacto_id: cid,
    estado: "pendiente" as const,
  }));

  const { error: ccError } = await admin.from("campana_contactos").insert(filas);
  if (ccError) {
    return NextResponse.json({ error: ccError.message }, { status: 500 });
  }

  return NextResponse.json({ id: campana.id });
}
