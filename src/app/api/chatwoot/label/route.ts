import { NextResponse } from "next/server";
import { addConversationLabel, removeConversationLabel } from "@/lib/chatwoot";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { conversation_id, label, action } = body;

  if (!conversation_id || !label || !["add", "remove"].includes(action)) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    const labels =
      action === "add"
        ? await addConversationLabel(conversation_id, label)
        : await removeConversationLabel(conversation_id, label);
    return NextResponse.json({ ok: true, labels });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "chatwoot error" },
      { status: 500 }
    );
  }
}
