-- Contato do doador compartilhado com a ONG, por interesse (RF06 + LGPD).
-- Rode no SQL Editor e apague o arquivo depois de aplicar.
--
-- O doador marca "Compartilhar meu contato" ao manifestar interesse. O client
-- só manda `share_contact`; quem preenche nome, e-mail e telefone é o trigger
-- abaixo, a partir do cadastro, para a ONG receber o contato real (e não algo
-- digitado). A ONG já lê os interesses das próprias necessidades pela
-- `interests_select_involved`, então `profiles` continua fechado para ela.
-- O consentimento fica preso ao interesse: cancelar o interesse apaga o
-- contato junto.

alter table public.interests
  add column if not exists share_contact boolean not null default false,
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text;

create or replace function public.fill_interest_contact()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.share_contact then
    select p.name, p.phone, u.email::text
      into new.contact_name, new.contact_phone, new.contact_email
      from public.profiles p
      join auth.users u on u.id = p.id
     where p.id = new.donor_id;
  else
    new.contact_name := null;
    new.contact_phone := null;
    new.contact_email := null;
  end if;

  return new;
end;
$$;

revoke all on function public.fill_interest_contact() from public, anon, authenticated;

drop trigger if exists trg_fill_interest_contact on public.interests;

-- também em UPDATE: o client não consegue gravar um contato inventado nem
-- manter o contato depois de desmarcar o compartilhamento
create trigger trg_fill_interest_contact
before insert or update on public.interests
for each row execute function public.fill_interest_contact();
