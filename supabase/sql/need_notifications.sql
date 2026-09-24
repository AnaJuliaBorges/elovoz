-- Avisos de nova necessidade para quem segue a ONG (RF09).
-- Rode no SQL Editor e apague o arquivo depois de aplicar.
--
-- O aviso nasce no banco: um trigger em `needs` grava uma linha em
-- `notifications` para cada doador que segue a ONG, mesmo com ele offline.
-- O client só lê (a tabela não tem policy de INSERT para usuários), e o
-- Realtime avisa o app aberto de que chegou linha nova.

create or replace function public.notify_followers_on_new_need()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.notifications (donor_id, need_id)
  select f.donor_id
       , new.id
    from public.ong_followers f
   where f.ong_id = new.ong_id;

  return new;
end;
$$;

-- só o trigger chama a função
revoke all on function public.notify_followers_on_new_need() from public, anon, authenticated;

drop trigger if exists trg_notify_followers_on_new_need on public.needs;

create trigger trg_notify_followers_on_new_need
after insert on public.needs
for each row execute function public.notify_followers_on_new_need();

-- a tela de avisos lista por doador, dos mais novos para os mais velhos
create index if not exists idx_notifications_donor_created
  on public.notifications (donor_id, created_at desc);

-- Realtime: o app escuta INSERT em `notifications` filtrado pelo próprio
-- `donor_id`; a RLS de SELECT decide o que cada conexão recebe
do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
