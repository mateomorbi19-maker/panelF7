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
      <div className="flex-1 p-6">
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
    <div className="flex-1 flex flex-col min-h-0">
      <div className="border-b border-f7border bg-f7panel px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-bold text-lg text-white">{telefono}</h1>
          <div className="flex gap-1 mt-1">
            {labels.map((l) => (
              <span
                key={l}
                className={
                  l === "bot_disabled"
                    ? "text-[10px] bg-f7red/15 text-f7red px-2 py-0.5 rounded-full font-medium"
                    : "text-[10px] bg-f7blue/15 text-f7blue px-2 py-0.5 rounded-full font-medium"
                }
              >
                {l}
              </span>
            ))}
          </div>
        </div>
        {conversationId && (
          <BotToggle
            conversationId={conversationId}
            initiallyDisabled={labels.includes("bot_disabled")}
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-f7black">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
