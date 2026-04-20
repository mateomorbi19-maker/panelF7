-- ============================================================
-- 001_crm_features.sql
-- Tablas CRM: contactos, plantillas, campanas, campana_contactos
-- + columna sent_from_panel en conversation_log
-- ============================================================

-- Extensión para gen_random_uuid() (idempotente)
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) contactos
-- ------------------------------------------------------------
create table if not exists public.contactos (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null,
  telefono            text not null unique,
  email               text,
  tipo                text not null check (tipo in ('cliente', 'lead_calificado')),
  vehiculo            text,
  ciudad              text,
  etiquetas           text[] not null default '{}',
  ultima_interaccion  timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists contactos_telefono_idx on public.contactos (telefono);
create index if not exists contactos_tipo_idx     on public.contactos (tipo);

-- ------------------------------------------------------------
-- 2) plantillas
-- ------------------------------------------------------------
create table if not exists public.plantillas (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null unique,
  categoria         text not null check (categoria in ('marketing', 'utility', 'authentication')),
  idioma            text not null default 'es',
  header_tipo       text check (header_tipo in ('text', 'image')),
  header_contenido  text,
  cuerpo            text not null,
  footer            text,
  botones           jsonb not null default '[]'::jsonb,
  estado            text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  created_at        timestamptz not null default now()
);

create index if not exists plantillas_estado_idx    on public.plantillas (estado);
create index if not exists plantillas_categoria_idx on public.plantillas (categoria);

-- ------------------------------------------------------------
-- 3) campanas
-- ------------------------------------------------------------
create table if not exists public.campanas (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  plantilla_id      uuid not null references public.plantillas(id),
  variables_mapeo   jsonb not null default '{}'::jsonb,
  total_contactos   int  not null default 0,
  enviados          int  not null default 0,
  fallidos          int  not null default 0,
  estado            text not null default 'borrador' check (estado in ('borrador', 'enviando', 'completada')),
  created_at        timestamptz not null default now(),
  completada_at     timestamptz
);

create index if not exists campanas_estado_idx       on public.campanas (estado);
create index if not exists campanas_plantilla_id_idx on public.campanas (plantilla_id);

-- ------------------------------------------------------------
-- 4) campana_contactos (pivote)
-- ------------------------------------------------------------
create table if not exists public.campana_contactos (
  id           uuid primary key default gen_random_uuid(),
  campana_id   uuid not null references public.campanas(id) on delete cascade,
  contacto_id  uuid not null references public.contactos(id),
  estado       text not null default 'pendiente' check (estado in ('pendiente', 'enviado', 'fallido')),
  enviado_at   timestamptz
);

create index if not exists campana_contactos_campana_id_idx  on public.campana_contactos (campana_id);
create index if not exists campana_contactos_contacto_id_idx on public.campana_contactos (contacto_id);
create index if not exists campana_contactos_estado_idx      on public.campana_contactos (estado);

-- ------------------------------------------------------------
-- 5) conversation_log.sent_from_panel
-- ------------------------------------------------------------
alter table public.conversation_log
  add column if not exists sent_from_panel boolean not null default false;
