import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getConversationMeta } from "@/lib/chatwoot";
import { MessageBubble } from "@/components/MessageBubble";
import { BotToggle } from "@/components/BotToggle";
import type { ConversationLogRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ConversacionDetailPage({
  params,
}: {
  params: { telefono: string };
}) {
  const telefono = decodeURIComponent(params.telefono);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("conversation_log")
    .select("*")
    .eq("telefono", telefono)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    return (
      <div className="p-6">
        <p className="text-f7red">Error cargando conversación: {error.message}</p>
      </div>
    );
  }
  if (!data || data.length === 0) {
    notFound();
  }

  const messages = data as ConversationLogRow[];
  const conversationId = messages.find((m) => m.conversation_id)?.conversation_id ?? null;

  let labels: string[] = [];
  if (conversationId) {
    const meta = await getConversationMeta(conversationId);
    labels = meta?.labels ?? [];
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-slate-200 bg-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/conversaciones"
            className="text-slate-500 hover:text-f7blue text-sm"
          >
            ← Volver
          </Link>
          <div>
            <h1 className="font-bold text-lg text-f7blue">{telefono}</h1>
            <div className="flex gap-1 mt-1">
              {labels.map((l) => (
                <span
                  key={l}
                  className="text-xs bg-f7red/10 text-f7red px-2 py-0.5 rounded-full font-medium"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
        {conversationId && (
          <BotToggle
            conversationId={conversationId}
            initiallyDisabled={labels.includes("bot_disabled")}
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
