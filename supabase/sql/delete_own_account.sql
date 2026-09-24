-- Exclusão da própria conta (RNF03/LGPD), chamada pela tela /perfil.
-- Rode no SQL Editor e apague o arquivo depois de aplicar.
--
-- O client só consegue apagar `profiles`, e aí o login em `auth.users`
-- continuaria existindo. Esta função apaga o usuário de `auth.users`, e o
-- `on delete cascade` leva o resto: profiles -> ongs -> needs -> interests,
-- e também interests, ong_followers e notifications do doador.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- conta de admin é criada e removida à mão, direto no Supabase
  if public.current_user_type() = 'admin' then
    raise exception 'Admin accounts cannot delete themselves'
      using errcode = '42501';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
