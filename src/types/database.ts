export type ConversationLogRow = {
  id: number;
  conversation_id: string | null;
  telefono: string;
  direction: "in" | "out";
  channel: "chatwoot" | "whatsapp_api" | "system";
  message_type: "text" | "image" | "video" | "audio" | "event";
  content: string | null;
  media_url: string | null;
  caption: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type ConversationSummary = {
  telefono: string;
  conversation_id: string | null;
  last_content: string | null;
  last_direction: "in" | "out";
  last_at: string;
  message_count: number;
  labels: string[];
};

export type FundasAMedidaRow = {
  id: number;
  brand: string;
  model: string;
  price_5plazas_cash: number | null;
  price_5plazas_transfer: number | null;
  price_2ind_cash: number | null;
  price_2ind_transfer: number | null;
  price_7asientos_cash: number | null;
  price_7asientos_transfer: number | null;
  medidas: boolean;
};

export type TermoformadasRow = {
  id: number;
  marca: string;
  vehiculo_modelo: string;
  efectivo: number | null;
  transferencia: number | null;
};

export type FundasTipoTapizadoRow = {
  id: number;
  brand: string;
  model: string;
  price_5plazas_cash: number | null;
  price_5plazas_transfer: number | null;
};
