-- ============================================
-- ESPEJO APP — Schema de base de datos
-- Ejecutar en: Supabase > SQL Editor
-- ============================================

-- Tabla de perfiles (extiende auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  strengths jsonb default '[]'::jsonb,
  life_areas jsonb default '{}'::jsonb,
  purpose text default '',
  patterns jsonb default '[]'::jsonb,
  sessions_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de sesiones
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  summary text,
  analysis jsonb,
  resources jsonb default '[]'::jsonb,
  areas_snapshot jsonb,
  completed boolean default false,
  created_at timestamptz default now()
);

-- Tabla de mensajes
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;

-- Profiles
create policy "Usuarios ven su propio perfil"
  on public.profiles for select using (auth.uid() = id);
create policy "Usuarios actualizan su propio perfil"
  on public.profiles for update using (auth.uid() = id);
create policy "Usuarios insertan su propio perfil"
  on public.profiles for insert with check (auth.uid() = id);

-- Sessions
create policy "Usuarios ven sus sesiones"
  on public.sessions for select using (auth.uid() = user_id);
create policy "Usuarios crean sus sesiones"
  on public.sessions for insert with check (auth.uid() = user_id);
create policy "Usuarios actualizan sus sesiones"
  on public.sessions for update using (auth.uid() = user_id);

-- Messages
create policy "Usuarios ven sus mensajes"
  on public.messages for select using (
    exists (
      select 1 from public.sessions
      where sessions.id = messages.session_id
      and sessions.user_id = auth.uid()
    )
  );
create policy "Usuarios insertan sus mensajes"
  on public.messages for insert with check (
    exists (
      select 1 from public.sessions
      where sessions.id = messages.session_id
      and sessions.user_id = auth.uid()
    )
  );

-- ============================================
-- Trigger: crear perfil al registrar usuario
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
