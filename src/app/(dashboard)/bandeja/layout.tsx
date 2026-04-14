import { createAdminClient } from "@/lib/supabase/server";
import { getConversationMeta } from "@/lib/chatwoot";
import { BandejaPane } from "@/components/BandejaPane";

export const dynamic = "force-dynamic";

async function getConversations() {
  const supabase = createAdminClient();

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
        map.get(r.telefono).message_count += 1;
      }
    });
    summaries = Array.from(map.values());
  } else {
    summaries = rows as any;
  }

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

  enriched.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
  return enriched;
}

export default async function BandejaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const conversations = await getConversations();

  return (
    <BandejaPane conversations={conversations}>{children}</BandejaPane>
  );
}
