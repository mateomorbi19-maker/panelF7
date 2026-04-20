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
  sent_from_panel: boolean;
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

export type ContactoRow = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  tipo: "cliente" | "lead_calificado";
  vehiculo: string | null;
  ciudad: string | null;
  etiquetas: string[];
  ultima_interaccion: string | null;
  created_at: string;
};

export type PlantillaBoton =
  | { tipo: "quick_reply"; texto: string }
  | { tipo: "url"; texto: string; url: string };

export type PlantillaRow = {
  id: string;
  nombre: string;
  categoria: "marketing" | "utility" | "authentication";
  idioma: string;
  header_tipo: "text" | "image" | null;
  header_contenido: string | null;
  cuerpo: string;
  footer: string | null;
  botones: PlantillaBoton[];
  estado: "pendiente" | "aprobada" | "rechazada";
  created_at: string;
};

export type VariableMapeo = {
  origen: "nombre" | "vehiculo" | "ciudad" | "texto_fijo";
  valor?: string;
};

export type CampanaRow = {
  id: string;
  nombre: string;
  plantilla_id: string;
  variables_mapeo: Record<string, VariableMapeo>;
  total_contactos: number;
  enviados: number;
  fallidos: number;
  estado: "borrador" | "enviando" | "completada";
  created_at: string;
  completada_at: string | null;
};

export type CampanaContactoRow = {
  id: string;
  campana_id: string;
  contacto_id: string;
  estado: "pendiente" | "enviado" | "fallido";
  enviado_at: string | null;
};
