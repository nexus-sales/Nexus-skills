-- ============================================================
-- Nexus Prompt Builder — Supabase Schema
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- NOTA: La tabla `profiles` ya existe. No recrear.
-- ============================================================

-- ── profiles (YA EXISTE — referencia) ────────────────────────
-- create table profiles (
--   id              uuid references auth.users(id) primary key,
--   email           text,
--   nombre          text,
--   role            text default 'user',
--   is_blocked      boolean default false,
--   telefono        text,
--   zone            text default 'todas',
--   permissions     text[] default '{}',
--   full_name_v7    text,
--   phone_v7        text,
--   company_name_v7 text,
--   signature_v7    text,
--   created_at      timestamptz default now(),
--   updated_v7_at   timestamptz
-- );
-- ────────────────────────────────────────────────────────────

-- Historial de prompts generados
create table if not exists prompt_history (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  text        text not null,
  title       text not null,
  date        text not null,
  created_at  timestamptz default now() not null
);

-- Plantillas personalizadas del usuario
create table if not exists custom_templates (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  state       jsonb not null,
  created_at  timestamptz not null
);

-- Agentes personalizados del usuario
create table if not exists custom_agents (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  data        jsonb not null,
  created_at  timestamptz not null,
  updated_at  timestamptz not null
);

-- ── Índices ────────────────────────────────────────────────
create index if not exists prompt_history_user_id_idx  on prompt_history  (user_id);
create index if not exists custom_templates_user_id_idx on custom_templates (user_id);
create index if not exists custom_agents_user_id_idx   on custom_agents   (user_id);

-- ── Row Level Security ─────────────────────────────────────
alter table prompt_history   enable row level security;
alter table custom_templates enable row level security;
alter table custom_agents    enable row level security;

-- Cada usuario solo ve y modifica sus propios datos
create policy "prompt_history: solo el dueño"
  on prompt_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "custom_templates: solo el dueño"
  on custom_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "custom_agents: solo el dueño"
  on custom_agents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Skills ─────────────────────────────────────────────────
create table if not exists custom_skills (
  id            text primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  description   text not null,
  icon          text not null default '⚡',
  category      text not null default 'custom',
  content       text not null,
  insert_target text not null default 'tarea',
  is_exportable boolean not null default true,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

create index if not exists custom_skills_user_id_idx on custom_skills (user_id);
alter table custom_skills enable row level security;
create policy "custom_skills: solo el dueño"
  on custom_skills for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Workflows ──────────────────────────────────────────────
create table if not exists custom_workflows (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  description text not null default '',
  icon        text not null default '🔗',
  steps       jsonb not null default '[]',
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists custom_workflows_user_id_idx on custom_workflows (user_id);
alter table custom_workflows enable row level security;
create policy "custom_workflows: solo el dueño"
  on custom_workflows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
