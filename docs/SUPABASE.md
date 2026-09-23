# Supabase do Elovoz

O schema e as policies já estão aplicados no projeto. O SQL correspondente está
em `supabase/migrations/` (histórico do que rodou) e o que ainda precisa ser
rodado à mão fica em `supabase/sql/`.

## Enums

| Enum | Valores |
|---|---|
| `user_type` | `donor`, `ong`, `admin` |
| `verification_status` | `pending`, `approved`, `rejected` |
| `urgency_level` | `low`, `medium`, `high` |
| `need_status` | `open`, `partially_fulfilled`, `fulfilled` |

Todos os `id` são `uuid`. Nomes de colunas em inglês; conteúdo (categorias,
etc.) em português, porque aparece para o usuário.

## Tabelas

| Tabela | Colunas principais | Observações |
|---|---|---|
| `profiles` | `id` (FK `auth.users`), `user_type`, `name`, `phone`, `created_at` | **sem trigger de criação** — quem insere é o client, logo após o `signUp` |
| `states` | `id`, `uf`, `name` | seed com as 27 UFs |
| `cities` | `id`, `state_id`, `name` | único por (`state_id`, `name`); seed só com Rio de Janeiro |
| `ongs` | `profile_id`, `trade_name`, `legal_name`, `cnpj`, `mission`, `state_id`, `city_id`, `neighborhood`, `address`, `instagram`, `facebook`, `website`, `verification_status` | uma ONG por perfil, na prática |
| `ong_contacts` | `ong_id`, `number`, `whatsapp` | vários telefones, cada um marcado ou não como WhatsApp |
| `categories` | `id`, `name`, `icon` | seed com 10 categorias + "Outros" |
| `needs` | `ong_id`, `category_id`, `title`, `description`, `quantity`, `urgency`, `deadline`, `status`, `created_at`, `updated_at` | `updated_at` mantido por trigger |
| `interests` | `need_id`, `donor_id`, `message`, `expected_quantity`, `expected_deadline` | RF06 |
| `ong_followers` | `donor_id`, `ong_id` | único por par; alimenta o RF09 |
| `notifications` | `donor_id`, `need_id`, `read` | **sem INSERT pelo client** — só server-side |

Índices para o RNF04: `needs(category_id)`, `needs(urgency)`, `needs(ong_id)`,
`ongs(state_id)`, `ongs(city_id)`, `ongs(neighborhood)`, `cities(state_id)`.

## RLS — resumo por tabela

| Tabela | Leitura | Escrita |
|---|---|---|
| `profiles` | dono ou admin | dono cria/edita a própria linha; trigger impede virar admin no UPDATE |
| `states`, `cities`, `categories` | pública | só admin |
| `ongs` | pública se `approved`; dono e admin sempre | dono cria (exige `user_type='ong'` e `verification_status='pending'`); trigger impede auto-aprovação |
| `ong_contacts` | onde a ONG for visível | dono da ONG ou admin |
| `needs` | onde a ONG for visível | só ONG `approved` cria; dono ou admin edita |
| `interests` | doador autor, ONG dona da necessidade, ou admin | doador cria a própria |
| `ong_followers` | próprio doador ou admin | doador segue/deixa de seguir |
| `notifications` | próprio doador ou admin | sem INSERT pelo client; doador só marca como lida |

A função `current_user_type()` é `SECURITY DEFINER` justamente para consultar
`profiles` sem disparar a RLS da própria `profiles` (evita recursão).

## Pegadinhas que já custaram tempo

1. **`profiles` não é criado por trigger.** O client insere a linha logo depois
   do `signUp` — e a policy exige `id = auth.uid()`. Isso só funciona com uma
   sessão ativa, ou seja: **confirmação de e-mail precisa estar desligada** em
   Authentication → Sign In / Providers. Com ela ligada, o cadastro cria a
   conta e falha no perfil (`src/features/auth/services/signUp.ts` devolve uma
   mensagem explicando isso).
2. **Ordem no cadastro de ONG.** `ongs_insert_own` chama `current_user_type()`,
   que lê `profiles`: sem o perfil gravado antes, o INSERT da ONG é recusado.
   A ordem é `profiles` → `ongs` → `ong_contacts`.
3. **`verification_status` explícito.** A policy exige o valor `'pending'` no
   INSERT; não basta contar com o default da coluna.
4. **Brecha de auto-promoção a admin (corrigida no banco).**
   `prevent_user_type_escalation` só roda em UPDATE, e `profiles_insert_own`
   não olha o `user_type`: dava para se cadastrar como `admin` direto pelo
   client. Um trigger `before insert` fecha isso. Ele foi aplicado pelo SQL
   Editor e o script foi apagado, então **não está em `supabase/migrations/`**.
   Se recriar o banco a partir das migrations, recrie esse trigger.
5. **UPDATE/DELETE barrado pela RLS não dá erro.** Só afeta zero linhas. Os
   services de `needs` encadeiam `.select("id").single()` para que isso vire o
   erro `PGRST116` e a tela consiga avisar.
6. **Filtro em tabela embutida precisa de `!inner`.** A busca usa
   `ong:ongs!inner(...)` com `.eq("ong.city_id", ...)`. Sem o `!inner`, o
   PostgREST só esvazia o objeto `ong` e a necessidade continua na lista.
7. **ONG `pending` não publica.** A policy `needs_insert_approved_ong` recusa o
   INSERT com erro `42501`; o painel já esconde o botão, e `needErrorMessage`
   traduz o erro caso ele apareça.
8. **A ONG lê o interesse, mas não quem o escreveu.**
   `interests_select_involved` devolve a linha para a ONG dona da necessidade,
   mas `profiles` continua visível só para o próprio dono — ou seja, dá para ler
   a mensagem e a quantidade prevista, nunca o nome ou o telefone de quem
   ofereceu. É por isso que o formulário de interesse exige mensagem e pede o
   contato dentro dela.
9. **Seguidores não são contáveis pelo client.** `ong_followers_select_own_or_admin`
   devolve só as linhas do próprio doador: dá para saber se *eu* sigo a ONG, nunca
   quantas pessoas seguem. E `ong_followers_insert_own` exige
   `current_user_type() = 'donor'` — por isso o botão de seguir nem aparece para
   ONG e admin.

## Ainda não configurado

- Storage: nenhum bucket em uso (o schema não guarda foto de perfil nem de
  necessidade). Se entrar, criar bucket público e documentar aqui.
- Realtime: precisa ser habilitado para a tabela `needs` quando o RF09 for
  implementado.
