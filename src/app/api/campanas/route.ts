import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { ContactoRow, VariableMapeo } from "@/types/database";

type Origen = VariableMapeo["origen"];

const SIN_VALOR: Record<Origen, string> = {
  nombre: "[sin nombre]",
  vehiculo: "[sin vehículo]",
  ciudad: "[sin ciudad]",
  texto_fijo: "[sin texto]",
};

function valorParaContacto(
  origen: Origen,
  c: Pick<ContactoRow, "nombre" | "vehiculo" | "ciudad"> | null,
  valor: string | undefined
): string {
  if (origen === "texto_fijo") return (valor ?? "").trim() || SIN_VALOR.texto_fijo;
  if (!c) return SIN_VALOR[origen];
  if (origen === "nombre") return c.nombre || SIN_VALOR.nombre;
  if (origen === "vehiculo") return c.vehiculo || SIN_VALOR.vehiculo;
  if (origen === "ciudad") return c.ciudad || SIN_VALOR.ciudad;
  return "";
}

function renderizarCuerpo(
  cuerpo: string,
  mapeo: Record<string, VariableMapeo>,
  contacto: Pick<ContactoRow, "nombre" | "vehiculo" | "ciudad"> | null
): string {
  return cuerpo.replace(/\{\{(\d+)\}\}/g, (_m, n) => {
    const map = mapeo[n];
    if (!map) return `{{${n}}}`;
    return valorParaContacto(map.origen, contacto, map.valor);
  });
}

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
  const mapeo = body.variables_mapeo ?? {};

  const { data: campana, error: campanaError } = await admin
    .from("campanas")
    .insert({
      nombre: body.nombre,
      plantilla_id: body.plantilla_id,
      variables_mapeo: mapeo,
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

  // Renderizar y persistir un mensaje saliente en conversation_log por cada contacto
  // para que el envío aparezca en la Bandeja de cada destinatario.
  const { data: plantilla, error: plantillaError } = await admin
    .from("plantillas")
    .select("cuerpo")
    .eq("id", body.plantilla_id)
    .single();

  if (plantillaError || !plantilla) {
    return NextResponse.json(
      { error: plantillaError?.message ?? "plantilla no encontrada" },
      { status: 500 }
    );
  }

  const { data: contactos, error: contactosError } = await admin
    .from("contactos")
    .select("id, telefono, nombre, vehiculo, ciudad")
    .in("id", body.contactos_ids);

  if (contactosError) {
    return NextResponse.json({ error: contactosError.message }, { status: 500 });
  }

  const filasLog = (contactos ?? []).map((c) => ({
    telefono: c.telefono,
    conversation_id: null,
    direction: "out" as const,
    channel: "whatsapp_api" as const,
    message_type: "text" as const,
    content: renderizarCuerpo(plantilla.cuerpo, mapeo, c),
    media_url: null,
    caption: null,
    metadata: {
      sender: "panel",
      user_email: user.email ?? null,
      campana_id: campana.id,
      campana_nombre: body.nombre,
      plantilla_id: body.plantilla_id,
    },
    sent_from_panel: true,
  }));

  if (filasLog.length > 0) {
    const { error: logError } = await admin.from("conversation_log").insert(filasLog);
    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: campana.id });
}
