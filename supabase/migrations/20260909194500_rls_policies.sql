-- ============================================================
-- Elovoz — RLS Policies
-- Migration: rls_policies
-- Depends on: 20260909193000_initial_schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- Helper: role lookup that avoids recursive RLS on profiles.
-- SECURITY DEFINER runs as the function owner (which bypasses
-- profiles' own RLS), so checking the caller's role here does
-- not re-trigger profiles' SELECT policy.
-- ------------------------------------------------------------
create or replace function public.current_user_type()
returns user_type
language sql
stable
security definer
set search_path = public
as $$
  select user_type from public.profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- Enable RLS on every table
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.states enable row level security;
alter table public.cities enable row level security;
alter table public.ongs enable row level security;
alter table public.ong_contacts enable row level security;
alter table public.categories enable row level security;
alter table public.needs enable row level security;
alter table public.interests enable row level security;
alter table public.ong_followers enable row level security;
alter table public.notifications enable row level security;

-- ============================================================
-- profiles — a user reads/edits their own row; admin sees all
-- ============================================================
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.current_user_type() = 'admin');

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.current_user_type() = 'admin')
with check (id = auth.uid() or public.current_user_type() = 'admin');

create policy "profiles_delete_own_or_admin"
on public.profiles for delete
to authenticated
using (id = auth.uid() or public.current_user_type() = 'admin');

-- Blocks self-promotion: only an admin can change someone's user_type
create or replace function public.prevent_user_type_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_type <> old.user_type and public.current_user_type() <> 'admin' then
    raise exception 'Only an admin can change user_type';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_user_type_escalation
before update on public.profiles
for each row execute function public.prevent_user_type_escalation();

-- ============================================================
-- states / cities / categories — public read, admin write
-- (the public-select policy already covers admin too; the
-- second policy below only adds write access for admin)
-- ============================================================
create policy "states_select_public"
on public.states for select
to public
using (true);

create policy "states_write_admin"
on public.states for all
to authenticated
using (public.current_user_type() = 'admin')
with check (public.current_user_type() = 'admin');

create policy "cities_select_public"
on public.cities for select
to public
using (true);

create policy "cities_write_admin"
on public.cities for all
to authenticated
using (public.current_user_type() = 'admin')
with check (public.current_user_type() = 'admin');

create policy "categories_select_public"
on public.categories for select
to public
using (true);

create policy "categories_write_admin"
on public.categories for all
to authenticated
using (public.current_user_type() = 'admin')
with check (public.current_user_type() = 'admin');

-- ============================================================
-- ongs — public profile only if approved (RF05); owner and
-- admin always see their own/all rows (RF08)
-- ============================================================
create policy "ongs_select_approved_or_own_or_admin"
on public.ongs for select
to public
using (
  verification_status = 'approved'
  or profile_id = auth.uid()
  or public.current_user_type() = 'admin'
);

create policy "ongs_insert_own"
on public.ongs for insert
to authenticated
with check (
  profile_id = auth.uid()
  and public.current_user_type() = 'ong'
  and verification_status = 'pending'
);

create policy "ongs_update_own_or_admin"
on public.ongs for update
to authenticated
using (profile_id = auth.uid() or public.current_user_type() = 'admin')
with check (profile_id = auth.uid() or public.current_user_type() = 'admin');

create policy "ongs_delete_own_or_admin"
on public.ongs for delete
to authenticated
using (profile_id = auth.uid() or public.current_user_type() = 'admin');

-- Only an admin can approve/reject (RF08) — the ONG owner can edit
-- their own data but not their own verification_status
create or replace function public.prevent_verification_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status <> old.verification_status and public.current_user_type() <> 'admin' then
    raise exception 'Only an admin can change verification_status';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_verification_status_change
before update on public.ongs
for each row execute function public.prevent_verification_status_change();

-- ============================================================
-- ong_contacts — visible wherever the parent ONG is visible;
-- editable by the ONG owner or admin
-- ============================================================
create policy "ong_contacts_select_visible"
on public.ong_contacts for select
to public
using (
  exists (
    select 1 from public.ongs
    where ongs.id = ong_contacts.ong_id
      and (
        ongs.verification_status = 'approved'
        or ongs.profile_id = auth.uid()
        or public.current_user_type() = 'admin'
      )
  )
);

create policy "ong_contacts_write_own_or_admin"
on public.ong_contacts for all
to authenticated
using (
  exists (
    select 1 from public.ongs
    where ongs.id = ong_contacts.ong_id
      and (ongs.profile_id = auth.uid() or public.current_user_type() = 'admin')
  )
)
with check (
  exists (
    select 1 from public.ongs
    where ongs.id = ong_contacts.ong_id
      and (ongs.profile_id = auth.uid() or public.current_user_type() = 'admin')
  )
);

-- ============================================================
-- needs — visible wherever the parent ONG is visible; only an
-- approved ONG can post (RF03); only the owner/admin can edit
-- ============================================================
create policy "needs_select_visible"
on public.needs for select
to public
using (
  exists (
    select 1 from public.ongs
    where ongs.id = needs.ong_id
      and (
        ongs.verification_status = 'approved'
        or ongs.profile_id = auth.uid()
        or public.current_user_type() = 'admin'
      )
  )
);

create policy "needs_insert_approved_ong"
on public.needs for insert
to authenticated
with check (
  exists (
    select 1 from public.ongs
    where ongs.id = needs.ong_id
      and ongs.profile_id = auth.uid()
      and ongs.verification_status = 'approved'
  )
);

create policy "needs_update_own_or_admin"
on public.needs for update
to authenticated
using (
  exists (select 1 from public.ongs where ongs.id = needs.ong_id and ongs.profile_id = auth.uid())
  or public.current_user_type() = 'admin'
)
with check (
  exists (select 1 from public.ongs where ongs.id = needs.ong_id and ongs.profile_id = auth.uid())
  or public.current_user_type() = 'admin'
);

create policy "needs_delete_own_or_admin"
on public.needs for delete
to authenticated
using (
  exists (select 1 from public.ongs where ongs.id = needs.ong_id and ongs.profile_id = auth.uid())
  or public.current_user_type() = 'admin'
);

-- ============================================================
-- interests (RF06) — visible to the donor who wrote it, the
-- ONG that owns the need, or admin
-- ============================================================
create policy "interests_select_involved"
on public.interests for select
to authenticated
using (
  donor_id = auth.uid()
  or exists (
    select 1 from public.needs
    join public.ongs on ongs.id = needs.ong_id
    where needs.id = interests.need_id and ongs.profile_id = auth.uid()
  )
  or public.current_user_type() = 'admin'
);

create policy "interests_insert_own"
on public.interests for insert
to authenticated
with check (donor_id = auth.uid() and public.current_user_type() = 'donor');

create policy "interests_update_own_or_admin"
on public.interests for update
to authenticated
using (donor_id = auth.uid() or public.current_user_type() = 'admin')
with check (donor_id = auth.uid() or public.current_user_type() = 'admin');

create policy "interests_delete_own_or_admin"
on public.interests for delete
to authenticated
using (donor_id = auth.uid() or public.current_user_type() = 'admin');

-- ============================================================
-- ong_followers (RF11) — a donor manages their own follows
-- ============================================================
create policy "ong_followers_select_own_or_admin"
on public.ong_followers for select
to authenticated
using (donor_id = auth.uid() or public.current_user_type() = 'admin');

create policy "ong_followers_insert_own"
on public.ong_followers for insert
to authenticated
with check (donor_id = auth.uid() and public.current_user_type() = 'donor');

create policy "ong_followers_delete_own_or_admin"
on public.ong_followers for delete
to authenticated
using (donor_id = auth.uid() or public.current_user_type() = 'admin');

-- ============================================================
-- notifications (RF09) — a donor only ever sees their own
-- ============================================================
create policy "notifications_select_own_or_admin"
on public.notifications for select
to authenticated
using (donor_id = auth.uid() or public.current_user_type() = 'admin');

-- No INSERT policy for regular users on purpose: notifications
-- are created server-side (trigger or Edge Function using the
-- service role key), which bypasses RLS entirely.

create policy "notifications_update_own"
on public.notifications for update
to authenticated
using (donor_id = auth.uid())
with check (donor_id = auth.uid());

create policy "notifications_delete_own_or_admin"
on public.notifications for delete
to authenticated
using (donor_id = auth.uid() or public.current_user_type() = 'admin');
