type ChatwootConversationMeta = {
  id: number;
  labels: string[];
  contact_name: string | null;
  contact_phone: string | null;
};

const BASE = process.env.CHATWOOT_API_URL!;
const TOKEN = process.env.CHATWOOT_API_TOKEN!;

async function cwFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      api_access_token: TOKEN,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Chatwoot ${path} failed: ${res.status} ${text}`);
  }
  return res;
}

export async function getConversationLabels(conversationId: string | number): Promise<string[]> {
  try {
    const res = await cwFetch(`/conversations/${conversationId}/labels`);
    const data = await res.json();
    return (data.payload ?? []) as string[];
  } catch {
    return [];
  }
}

export async function setConversationLabels(
  conversationId: string | number,
  labels: string[]
): Promise<void> {
  await cwFetch(`/conversations/${conversationId}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels }),
  });
}

export async function addConversationLabel(
  conversationId: string | number,
  label: string
): Promise<string[]> {
  const current = await getConversationLabels(conversationId);
  if (current.includes(label)) return current;
  const next = [...current, label];
  await setConversationLabels(conversationId, next);
  return next;
}

export async function removeConversationLabel(
  conversationId: string | number,
  label: string
): Promise<string[]> {
  const current = await getConversationLabels(conversationId);
  const next = current.filter((l) => l !== label);
  if (next.length === current.length) return current;
  await setConversationLabels(conversationId, next);
  return next;
}

export async function getConversationMeta(
  conversationId: string | number
): Promise<ChatwootConversationMeta | null> {
  try {
    const res = await cwFetch(`/conversations/${conversationId}`);
    const data = await res.json();
    return {
      id: data.id,
      labels: data.labels ?? [],
      contact_name: data.meta?.sender?.name ?? null,
      contact_phone: data.meta?.sender?.phone_number ?? null,
    };
  } catch {
    return null;
  }
}
