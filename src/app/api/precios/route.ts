import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const ALLOWED_TABLES = ["fundas_a_medida", "termoformadas", "fundas_tipo_tapizado"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

function isAllowed(t: string): t is AllowedTable {
  return (ALLOWED_TABLES as readonly string[]).includes(t);
}

async function requireAuth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(req: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  if (!table || !isAllowed(table)) {
    return NextResponse.json({ error: "invalid table" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from(table)
    .select("*")
    .order("id", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data });
}

export async function POST(req: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { table, row } = body;
  if (!table || !isAllowed(table) || !row) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const admin = createAdminClient();
  // Upsert: if id present => update, else insert
  if (row.id) {
    const { error } = await admin.from(table).update(row).eq("id", row.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await admin.from(table).insert(row);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const id = searchParams.get("id");
  if (!table || !isAllowed(table) || !id) {
    return NextResponse.json({ error: "invalid query" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from(table).delete().eq("id", Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
