-- ============================================================
-- Elovoz — Initial schema
-- Migration: initial_schema
-- ============================================================

-- Extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
create type user_type as enum ('donor', 'ong', 'admin');
create type verification_status as enum ('pending', 'approved', 'rejected');
create type urgency_level as enum ('low', 'medium', 'high');
create type need_status as enum ('open', 'partially_fulfilled', 'fulfilled');

-- ------------------------------------------------------------
-- profiles (extends auth.users)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  user_type user_type not null,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- states (Brazilian UFs — fixed list of 27)
-- ------------------------------------------------------------
create table public.states (
  id uuid primary key default gen_random_uuid(),
  uf text not null unique,
  name text not null
);

insert into public.states (uf, name) values
  ('AC', 'Acre'),
  ('AL', 'Alagoas'),
  ('AP', 'Amapá'),
  ('AM', 'Amazonas'),
  ('BA', 'Bahia'),
  ('CE', 'Ceará'),
  ('DF', 'Distrito Federal'),
  ('ES', 'Espírito Santo'),
  ('GO', 'Goiás'),
  ('MA', 'Maranhão'),
  ('MT', 'Mato Grosso'),
  ('MS', 'Mato Grosso do Sul'),
  ('MG', 'Minas Gerais'),
  ('PA', 'Pará'),
  ('PB', 'Paraíba'),
  ('PR', 'Paraná'),
  ('PE', 'Pernambuco'),
  ('PI', 'Piauí'),
  ('RJ', 'Rio de Janeiro'),
  ('RN', 'Rio Grande do Norte'),
  ('RS', 'Rio Grande do Sul'),
  ('RO', 'Rondônia'),
  ('RR', 'Roraima'),
  ('SC', 'Santa Catarina'),
  ('SP', 'São Paulo'),
  ('SE', 'Sergipe'),
  ('TO', 'Tocantins');

-- ------------------------------------------------------------
-- cities (curated, grows like categories — starts with Rio de Janeiro)
-- ------------------------------------------------------------
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  state_id uuid not null references public.states (id),
  name text not null,
  unique (state_id, name)
);

insert into public.cities (state_id, name)
select id, 'Rio de Janeiro' from public.states where uf = 'RJ';

-- ------------------------------------------------------------
-- ongs
-- ------------------------------------------------------------
create table public.ongs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  trade_name text not null,
  legal_name text not null,
  cnpj text not null,
  mission text not null,
  state_id uuid not null references public.states (id),
  city_id uuid not null references public.cities (id),
  neighborhood text not null,
  address text not null,
  instagram text,
  facebook text,
  website text,
  verification_status verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ong_contacts (multiple numbers per ONG, with WhatsApp flag)
-- ------------------------------------------------------------
create table public.ong_contacts (
  id uuid primary key default gen_random_uuid(),
  ong_id uuid not null references public.ongs (id) on delete cascade,
  number text not null,
  whatsapp boolean not null default false
);

-- ------------------------------------------------------------
-- categories
-- ------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text
);

insert into public.categories (name) values
  ('Roupas e Calçados'),
  ('Alimentos'),
  ('Itens de Saúde'),
  ('Higiene Pessoal'),
  ('Produtos de Limpeza'),
  ('Itens Infantis'),
  ('Material Escolar'),
  ('Cobertores e Agasalhos'),
  ('Brinquedos'),
  ('Livros'),
  ('Outros');

-- ------------------------------------------------------------
-- needs
-- ------------------------------------------------------------
create table public.needs (
  id uuid primary key default gen_random_uuid(),
  ong_id uuid not null references public.ongs (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  title text not null,
  description text,
  quantity integer,
  urgency urgency_level not null default 'medium',
  deadline date,
  status need_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- keeps updated_at current on every UPDATE (used in RF07)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_needs_updated_at
before update on public.needs
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- interests (RF06)
-- ------------------------------------------------------------
create table public.interests (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references public.needs (id) on delete cascade,
  donor_id uuid not null references public.profiles (id) on delete cascade,
  message text,
  expected_quantity integer,
  expected_deadline date,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ong_followers (RF11)
-- ------------------------------------------------------------
create table public.ong_followers (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles (id) on delete cascade,
  ong_id uuid not null references public.ongs (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (donor_id, ong_id)
);

-- ------------------------------------------------------------
-- notifications (RF09)
-- ------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles (id) on delete cascade,
  need_id uuid not null references public.needs (id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Indexes (RNF04 — search with filters under 2s)
-- ------------------------------------------------------------
create index idx_needs_category on public.needs (category_id);
create index idx_needs_urgency on public.needs (urgency);
create index idx_needs_ong on public.needs (ong_id);
create index idx_ongs_state on public.ongs (state_id);
create index idx_ongs_city on public.ongs (city_id);
create index idx_ongs_neighborhood on public.ongs (neighborhood);
create index idx_cities_state on public.cities (state_id);
