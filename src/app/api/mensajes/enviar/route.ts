import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.telefono !== "string" || typeof body.mensaje !== "string") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const telefono = body.telefono.trim();
  const mensaje = body.mensaje.trim();
  if (!telefono || !mensaje) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // Simula latencia de red
  await new Promise((r) => setTimeout(r, 400));

  const admin = createAdminClient();

  // Recupera conversation_id más reciente para replicar el shape de mensajes salientes existentes
  const { data: lastRow } = await admin
    .from("conversation_log")
    .select("conversation_id")
    .eq("telefono", telefono)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const insertRow = {
    telefono,
    conversation_id: lastRow?.conversation_id ?? null,
    direction: "out" as const,
    channel: "whatsapp_api" as const,
    message_type: "text" as const,
    content: mensaje,
    media_url: null,
    caption: null,
    metadata: { sender: "panel", user_email: user.email ?? null },
    sent_from_panel: true,
  };

  const { data: inserted, error } = await admin
    .from("conversation_log")
    .insert(insertRow)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: inserted?.id });
}
