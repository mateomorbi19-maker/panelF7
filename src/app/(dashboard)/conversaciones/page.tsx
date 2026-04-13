import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getConversationMeta } from "@/lib/chatwoot";
import { ConversationFilter } from "@/components/ConversationFilter";

type SearchParams = { label?: string; q?: string };

const AVAILABLE_LABELS = [
  "butacas",
  "turno",
  "combo",
  "cuotas",
  "venta",
  "bot_disabled",
];

export const dynamic = "force-dynamic";

async function getConversations(searchParams: SearchParams) {
  const supabase = createAdminClient();

  // Get last message per telefono
  const { data: rows, error } = await supabase.rpc("get_conversation_summaries" as any, {});

  let summaries: Array<{
    telefono: string;
    conversation_id: string | null;
    last_content: string | null;
    last_direction: "in" | "out";
    last_at: string;
    message_count: number;
  }> = [];

  if (error || !rows) {
    // Fallback: fetch manually
    const { data } = await supabase
      .from("conversation_log")
      .select("telefono, conversation_id, direction, content, created_at, message_type")
      .order("created_at", { ascending: false })
      .limit(2000);

    const map = new Map<string, any>();
    (data ?? []).forEach((r: any) => {
      if (!map.has(r.telefono)) {
        map.set(r.telefono, {
          telefono: r.telefono,
          conversation_id: r.conversation_id,
          last_content: r.content ?? `[${r.message_type}]`,
          last_direction: r.direction,
          last_at: r.created_at,
          message_count: 1,
        });
      } else {
        const existing = map.get(r.telefono);
        existing.message_count += 1;
      }
    });
    summaries = Array.from(map.values());
  } else {
    summaries = rows as any;
  }

  // Enrich with labels from Chatwoot (parallel, only for filtered subset)
  const enriched = await Promise.all(
    summaries.map(async (s) => {
      let labels: string[] = [];
      if (s.conversation_id) {
        const meta = await getConversationMeta(s.conversation_id);
        labels = meta?.labels ?? [];
      }
      return { ...s, labels };
    })
  );

  let filtered = enriched;
  if (searchParams.label) {
    filtered = filtered.filter((c) => c.labels.includes(searchParams.label!));
  }
  if (searchParams.q) {
    const q = searchParams.q.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.telefono.toLowerCase().includes(q) ||
        (c.last_content ?? "").toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
  return filtered;
}

export default async function ConversacionesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const conversations = await getConversations(searchParams);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-f7blue">Conversaciones</h1>
        <span className="text-sm text-slate-500">{conversations.length} total</span>
      </div>

      <ConversationFilter labels={AVAILABLE_LABELS} />

      <div className="mt-4 bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
        {conversations.length === 0 && (
          <div className="p-8 text-center text-slate-500">No hay conversaciones</div>
        )}
        {conversations.map((c) => (
          <Link
            key={c.telefono}
            href={`/conversaciones/${encodeURIComponent(c.telefono)}`}
            className="block p-4 hover:bg-slate-50 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-f7blue">{c.telefono}</span>
                  {c.labels.map((label) => (
                    <span
                      key={label}
                      className="text-xs bg-f7red/10 text-f7red px-2 py-0.5 rounded-full font-medium"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-slate-600 truncate">
                  {c.last_direction === "out" ? "→ " : "← "}
                  {c.last_content ?? "[sin contenido]"}
                </p>
              </div>
              <div className="text-xs text-slate-400 shrink-0">
                {new Date(c.last_at).toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
