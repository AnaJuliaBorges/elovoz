-- Horários de funcionamento da ONG (uma faixa por dia da semana).
-- Rode no SQL Editor e apague o arquivo depois de aplicar.

create table if not exists public.ong_opening_hours (
  id uuid primary key default gen_random_uuid(),
  ong_id uuid not null references public.ongs (id) on delete cascade,
  -- 0 = domingo, igual ao extract(dow) do Postgres
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  constraint ong_opening_hours_range check (closes_at > opens_at),
  unique (ong_id, weekday)
);

create index if not exists idx_ong_opening_hours_ong
  on public.ong_opening_hours (ong_id);

alter table public.ong_opening_hours enable row level security;

-- Visível onde a ONG for visível (mesma regra de ong_contacts): doador só
-- enxerga ONG aprovada; dona e admin enxergam sempre.
drop policy if exists "ong_opening_hours_select_visible" on public.ong_opening_hours;
create policy "ong_opening_hours_select_visible"
on public.ong_opening_hours for select
to public
using (
  exists (
    select 1 from public.ongs
    where ongs.id = ong_opening_hours.ong_id
      and (
        ongs.verification_status = 'approved'
        or ongs.profile_id = auth.uid()
        or public.current_user_type() = 'admin'
      )
  )
);

-- Só a dona da ONG (ou admin) escreve.
drop policy if exists "ong_opening_hours_write_own_or_admin" on public.ong_opening_hours;
create policy "ong_opening_hours_write_own_or_admin"
on public.ong_opening_hours for all
to authenticated
using (
  exists (
    select 1 from public.ongs
    where ongs.id = ong_opening_hours.ong_id
      and (ongs.profile_id = auth.uid() or public.current_user_type() = 'admin')
  )
)
with check (
  exists (
    select 1 from public.ongs
    where ongs.id = ong_opening_hours.ong_id
      and (ongs.profile_id = auth.uid() or public.current_user_type() = 'admin')
  )
);
