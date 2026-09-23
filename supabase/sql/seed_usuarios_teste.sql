-- Usuários de teste do Elovoz.
-- Rode no SQL Editor. Pode rodar de novo quando quiser: o script apaga e
-- recria tudo que termina em @teste.elovoz.
--
-- Senha de todos: elovoz123
--
--   doadora@teste.elovoz       doadora, já segue a Casa Solidária e
--                              manifestou interesse numa necessidade
--   ong@teste.elovoz           ONG aprovada, com contatos, horários e
--                              3 necessidades
--   ong.pendente@teste.elovoz  ONG aguardando aprovação (vê o aviso no painel)
--   admin@teste.elovoz         administrador (RF08)

set search_path = public, extensions;

-- ------------------------------------------------------------
-- Limpa o que este script criou antes (a cascata cuida do resto)
-- ------------------------------------------------------------
delete from auth.users where email like '%@teste.elovoz';

-- ------------------------------------------------------------
-- Contas no Auth
-- ------------------------------------------------------------
with novos as (
  select *
  from (values
    ('11111111-1111-4111-8111-111111111111'::uuid, 'doadora@teste.elovoz'),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'ong@teste.elovoz'),
    ('33333333-3333-4333-8333-333333333333'::uuid, 'ong.pendente@teste.elovoz'),
    ('44444444-4444-4444-8444-444444444444'::uuid, 'admin@teste.elovoz')
  ) as t(id, email)
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  novos.id,
  'authenticated',
  'authenticated',
  novos.email,
  crypt('elovoz123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  '', '', '', ''
from novos;

-- sem a identidade, o login por e-mail/senha não encontra a conta
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(),
  now(),
  now()
from auth.users u
where u.email like '%@teste.elovoz';

-- ------------------------------------------------------------
-- Perfis (no app essa linha nasce no cadastro; aqui é na mão)
--
-- Os triggers ficam desligados durante o INSERT por causa do que barra
-- cadastro com user_type = 'admin' pelo client: sem isso a linha do
-- administrador seria recusada. Se algo falhar no meio, a transação volta
-- atrás e os triggers voltam junto.
-- ------------------------------------------------------------
alter table public.profiles disable trigger user;

insert into public.profiles (id, user_type, name, phone) values
  ('11111111-1111-4111-8111-111111111111', 'donor', 'Ana Doadora', '21999990001'),
  ('22222222-2222-4222-8222-222222222222', 'ong', 'Casa Solidária', '21999990002'),
  ('33333333-3333-4333-8333-333333333333', 'ong', 'Instituto Semente', '21999990003'),
  ('44444444-4444-4444-8444-444444444444', 'admin', 'Admin Elovoz', null);

alter table public.profiles enable trigger user;

-- ------------------------------------------------------------
-- ONGs (localização vem do seed de estados/cidades)
-- ------------------------------------------------------------
insert into public.ongs (
  id, profile_id, trade_name, legal_name, cnpj, mission,
  state_id, city_id, neighborhood, address,
  instagram, website, verification_status
)
select
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  '22222222-2222-4222-8222-222222222222'::uuid,
  'Casa Solidária',
  'Associação Casa Solidária',
  '11222333000181',
  'Acolher famílias em situação de rua no centro da cidade, com refeições diárias e apoio na busca por moradia.',
  s.id, c.id, 'Centro', 'Rua das Flores, 100',
  '@casasolidaria', 'https://casasolidaria.org.br',
  'approved'
from public.states s
join public.cities c on c.state_id = s.id
where s.uf = 'RJ' and c.name = 'Rio de Janeiro'
limit 1;

insert into public.ongs (
  id, profile_id, trade_name, legal_name, cnpj, mission,
  state_id, city_id, neighborhood, address, verification_status
)
select
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
  '33333333-3333-4333-8333-333333333333'::uuid,
  'Instituto Semente',
  'Instituto Semente de Educação',
  '04252011000110',
  'Reforço escolar e material didático para crianças da comunidade.',
  s.id, c.id, 'Tijuca', 'Rua do Bispo, 40',
  'pending'
from public.states s
join public.cities c on c.state_id = s.id
where s.uf = 'RJ' and c.name = 'Rio de Janeiro'
limit 1;

-- ------------------------------------------------------------
-- Contatos e horários da ONG aprovada
-- ------------------------------------------------------------
insert into public.ong_contacts (ong_id, number, whatsapp) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '21999991234', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2133331234', false);

insert into public.ong_opening_hours (ong_id, weekday, opens_at, closes_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1, '09:00', '17:00'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 2, '09:00', '17:00'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 3, '09:00', '17:00'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 4, '09:00', '17:00'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 5, '09:00', '17:00'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 6, '08:00', '12:00');

-- ------------------------------------------------------------
-- Necessidades da ONG aprovada (uma de cada urgência/status)
-- ------------------------------------------------------------
insert into public.needs (
  id, ong_id, category_id, title, description, quantity, urgency, deadline, status
)
select
  'cccccccc-cccc-4ccc-8ccc-cccccccccc01'::uuid,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  id,
  'Cestas básicas para 30 famílias',
  'Arroz, feijão, óleo e café. Entrega na sede, de segunda a sexta.',
  30, 'high', current_date + 30, 'open'
from public.categories where name = 'Alimentos';

insert into public.needs (
  id, ong_id, category_id, title, description, quantity, urgency, deadline, status
)
select
  'cccccccc-cccc-4ccc-8ccc-cccccccccc02'::uuid,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  id,
  'Cobertores para o inverno',
  'De solteiro ou casal; usados em bom estado também servem.',
  50, 'medium', current_date + 60, 'partially_fulfilled'
from public.categories where name = 'Cobertores e Agasalhos';

insert into public.needs (
  id, ong_id, category_id, title, description, quantity, urgency, status
)
select
  'cccccccc-cccc-4ccc-8ccc-cccccccccc03'::uuid,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  id,
  'Material escolar para a volta às aulas',
  'Cadernos, lápis e mochilas.',
  40, 'low', 'fulfilled'
from public.categories where name = 'Material Escolar';

-- ------------------------------------------------------------
-- A doadora já segue a ONG e já manifestou interesse
-- ------------------------------------------------------------
insert into public.ong_followers (donor_id, ong_id) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.interests (
  need_id, donor_id, message, expected_quantity, expected_deadline
) values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccc01',
  '11111111-1111-4111-8111-111111111111',
  'Consigo montar 10 cestas. Falo pelo (21) 99999-0001 ou ana@teste.elovoz.',
  10,
  current_date + 15
);
