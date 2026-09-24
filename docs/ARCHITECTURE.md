# Arquitetura do Elovoz

Mapa das features e dos arquivos que cada uma toca. Mantenha atualizado quando
adicionar feature ou rota.

## Camadas

```
src/
├── main.tsx                 # todas as rotas, em um lugar só (createBrowserRouter)
├── App.tsx                  # elemento raiz: scroll reset + <Outlet /> + Toaster
├── index.css                # tokens do tema (Tailwind v4, @theme)
├── routes/guards.ts         # protectedLoader, publicOnlyLoader, donorLoader, ongLoader, adminLoader
├── lib/                     # supabase, queryClient, reportError, masks, dates, utils
├── hooks/
│   ├── useLocations.ts      # estados e cidades (selects encadeados)
│   └── useDebouncedValue.ts # atraso para campos de texto livre (filtro de bairro)
├── components/
│   ├── layout/              # LayoutWrapper, MenuBar, RouteError, Placeholder
│   ├── shared/              # BackButton, LocationFields
│   └── ui/                  # primitivos shadcn (+ barrel index.tsx)
└── features/<feature>/      # pages, components, hooks, services, model, store, steps
```

Fronteira entre features é validada pelo ESLint: de dentro de `src/features/`,
importe outra feature só por `@/features/<nome>` (o `index.ts` dela). Páginas
nunca entram no barrel — só o `main.tsx` as importa, direto, para o code
splitting funcionar.

## Rotas

| Rota | Layout | Loader | Estado |
|---|---|---|---|
| `/` | AuthLayout | `publicOnlyLoader` | Home (landing) ✅ |
| `/login` | AuthLayout | `publicOnlyLoader` | ✅ |
| `/cadastrar` | AuthLayout | — | wizard doador/ONG ✅ |
| `/recuperar-senha`, `/redefinir-senha` | AuthLayout | — | ✅ |
| `/necessidades` | AppLayout | `protectedLoader` | busca com filtros ✅ (RF04) |
| `/necessidades/:id` | AppLayout | `protectedLoader` | detalhe + manifestar interesse ✅ (RF06) |
| `/ongs/:id` | AppLayout | `protectedLoader` | perfil público + seguir ✅ (RF05, RF11) |
| `/painel` | AppLayout | `ongLoader` | necessidades da ONG + status ✅ (RF03, RF07) |
| `/painel/necessidades/nova`, `/painel/necessidades/:id/editar` | AppLayout | `ongLoader` | form de necessidade ✅ (RF03) |
| `/painel/horarios` | AppLayout | `ongLoader` | horários de funcionamento da ONG ✅ |
| `/minhas-doacoes` | AppLayout | `donorLoader` | histórico de interesses + ONGs seguidas ✅ (RF06, RF11) |
| `/notificacoes` | AppLayout | `protectedLoader` | placeholder (RF09) |
| `/perfil` | AppLayout | `protectedLoader` | dados da conta, privacidade, exclusão de conta e sair ✅ (RNF03) |
| `/admin` | AppLayout | `adminLoader` | placeholder (RF08) |

O papel do usuário (`profiles.user_type`) decide para onde o login leva e o que
o MenuBar mostra. O mapa está em `src/features/auth/model/profile.ts`
(`HOME_BY_USER_TYPE`) e em `MENU_BY_USER_TYPE`, no `MenuBar.tsx`.

## Features

### `auth` (implementada)

Login, cadastro e recuperação de senha.

| Arquivo | Papel |
|---|---|
| `pages/Home.tsx` | landing do visitante |
| `pages/LoginPage.tsx` | login; redireciona pela home do papel |
| `pages/SignUpPage.tsx` | orquestra o wizard e trata o recarregamento da página |
| `pages/ForgotPasswordPage.tsx`, `pages/ResetPasswordPage.tsx` | fluxo de senha |
| `model/profile.ts` | `UserType`, `Profile`, `HOME_BY_USER_TYPE` |
| `model/schema.ts` | schemas zod de todos os formulários |
| `services/profiles.ts` | ler/criar/atualizar a linha em `profiles` (`updateProfile` é usado pela feature `profile`) |
| `services/signUp.ts` | cadastro de doador e de ONG, na ordem que a RLS exige |
| `services/passwordReset.ts` | `resetPasswordForEmail` + `updateUser` |
| `hooks/useProfile.ts` | perfil do usuário logado (TanStack Query) |
| `hooks/useLogin.ts`, `hooks/useLogout.ts` | entrar e sair |
| `signUp/store/useSignUpWizardStore.ts` | estado do wizard (Zustand + persist) |
| `signUp/hooks/useSignUpWizard.ts` | passo a passo, submits e erros |
| `signUp/steps/*` | `AccountStep`, `OngDataStep`, `OngContactStep`, `OngHoursStep`, `PendingReview` |

**Cadastro de doador:** 1 passo → `signUp` → `profiles` (`donor`) → vai para
`/necessidades`.

**Cadastro de ONG:** 4 passos (conta → dados institucionais → localização e
contato → horários de funcionamento). As gravações só acontecem no fim, nesta
ordem obrigatória:

```
auth.signUp → profiles (user_type='ong') → ongs (verification_status='pending')
  → ong_contacts → ong_opening_hours
```

Os horários são opcionais: quem não marcar nenhum dia termina o cadastro do
mesmo jeito e preenche depois em `/painel/horarios`.

Cada etapa é idempotente (relê antes de gravar), então uma nova tentativa depois
de erro parcial não duplica nada. O erro carrega o estágio que falhou
(`SignUpError.stage`). Como a senha não é persistida no `localStorage` de
propósito, recarregar a página no meio do wizard devolve o usuário ao passo 1
com um aviso — o resto dos dados continua preenchido.

### `needs` (implementada)

Cadastro, busca e status das necessidades (RF03, RF04, RF07).

| Arquivo | Papel |
|---|---|
| `pages/SearchNeedsPage.tsx` | busca do doador; os filtros moram na URL (`?categoria=&urgencia=&estado=&cidade=&bairro=`), então voltar do detalhe não perde nada |
| `pages/NeedDetailPage.tsx` | detalhe + link para a ONG; "Editar" só aparece para a ONG dona |
| `pages/OngDashboardPage.tsx` | painel: aviso de cadastro pendente/recusado, lista com status, editar e excluir |
| `pages/CreateNeedPage.tsx`, `pages/EditNeedPage.tsx` | carregam os dados e só então montam o `NeedForm` (sem `reset()` tardio). Depois de salvar, a edição volta para onde a pessoa veio (`state.from`, aceito só se for caminho interno), e não sempre para o painel |
| `components/NeedForm.tsx` | form de criar/editar |
| `components/NeedFiltersBar.tsx` | categoria, urgência, estado/cidade e bairro (com debounce) |
| `components/OngNeedItem.tsx` | linha do painel: select de status, editar, excluir com confirmação |
| `components/NeedCard.tsx`, `components/NeedBadges.tsx` | card da busca (a ONG só aparece quando vem no embed — no perfil dela seria repetição); badges de urgência e de status |
| `model/need.ts` | tipos, rótulos em português, `formatOngLocation`, `isOpenForDonation` |
| `model/schema.ts` | `needSchema`, `emptyNeedForm`, `needToForm` |
| `model/filters.ts` | filtros ↔ query string |
| `services/needs.ts` | busca paginada, CRUD e `needErrorMessage` |
| `services/categories.ts` | categorias, com "Outros" por último |
| `hooks/useNeedQueries.ts`, `hooks/useNeedMutations.ts`, `hooks/useCategories.ts` | TanStack Query; toda escrita invalida `["needs"]` |

**Regras da busca:** só `open` e `partially_fulfilled`, com prazo vazio ou a
partir de hoje; urgência alta primeiro, depois as mais novas; 12 por página
("Carregar mais"). A RLS já esconde as ONGs não aprovadas.

**Painel:** o `ongLoader` garante o papel `ong`, mas o que aparece depende do
`verification_status` da ONG (`useMyOng`, da feature `ongs`). Só ONG aprovada vê
a lista e o botão de nova necessidade, porque a policy de INSERT recusaria as
outras de qualquer jeito.

### `ongs` (implementada, menos a edição dos dados)

Perfil público da instituição e seguir/deixar de seguir (RF05, RF11), mais o
`useMyOng` que o painel usa.

| Arquivo | Papel |
|---|---|
| `pages/OngProfilePage.tsx` | perfil: missão, contato, endereço e as necessidades da ONG |
| `components/FollowOngButton.tsx` | toggle seguir/seguindo; só aparece para doador |
| `components/OngContacts.tsx` | telefones (WhatsApp vai pro `wa.me`, fixo pro discador) e redes |
| `model/ong.ts` | `MyOng`, `OngProfile`, `OngContact`, formatação de endereço e links das redes |
| `services/ongs.ts` | `fetchMyOng` (por `profile_id`) e `fetchOngProfile` (por `id`, com embeds) |
| `services/ongFollowers.ts` | `fetchIsFollowingOng`, `fetchFollowedOngs`, `followOng`, `unfollowOng`, `followErrorMessage` |
| `components/FollowedOngsList.tsx` | ONGs que o doador segue, com "Deixar de seguir"; exportada para `/minhas-doacoes` |
| `pages/OngHoursPage.tsx` | `/painel/horarios`: a ONG edita a própria semana |
| `components/OpeningHoursFields.tsx` | os sete dias com "abre" + faixa de horário; controlado, porque serve o cadastro e o painel |
| `components/OngOpeningHours.tsx` | a mesma semana agrupada para leitura no perfil |
| `model/openingHours.ts` | `OpeningHour`, schema, conversões formulário↔banco e `groupOpeningHours` |
| `services/ongOpeningHours.ts` | `fetchOngOpeningHours` e `saveOngOpeningHours` |
| `hooks/useMyOng.ts`, `hooks/useOngProfile.ts`, `hooks/useFollowOng.ts`, `hooks/useOngOpeningHours.ts` | TanStack Query; `queryKeys.ts` guarda as chaves |

**O que o perfil mostra:** dados institucionais, missão, contatos, endereço e
CNPJ, mais as necessidades da ONG divididas em "Precisa agora" (as que ainda dão
para atender, pela mesma regra da busca) e "Já atendidas" (RF10, histórico curto
que serve de prova de trabalho). Reaproveita `NeedCard`, `useOngNeeds` e
`isOpenForDonation` da feature `needs`.

**Seguir (RF11):** botão toggle com `aria-pressed`, escondido para quem não é
doador — a policy de INSERT em `ong_followers` exige
`current_user_type() = 'donor'`, então para ONG e admin ele só existiria para
dar erro. Seguir duas vezes não é erro: o par (`donor_id`, `ong_id`) é único e o
service engole o `23505`. Seguir ou deixar de seguir invalida tanto o estado do
botão (`["ongs", "following", id]`) quanto a lista de seguidas
(`["ongs", "followed"]`).

**Horários de funcionamento:** uma linha por dia da semana em
`ong_opening_hours` (0 = domingo, igual ao `extract(dow)`), preenchida no último
passo do cadastro e editável em `/painel/horarios`. O formulário mostra a semana
começando na segunda e tem um atalho que repete o primeiro horário nos dias
úteis; salvar substitui a semana inteira (apaga e regrava), que para sete linhas
sai mais simples do que diferença linha a linha. No perfil, dias vizinhos com a
mesma faixa viram "Seg a Sex" e dias salteados viram "Seg, Qua e Sex".

**Falta:** a ONG editar o resto dos dados institucionais (nome, missão,
endereço, contatos e redes) — hoje só os horários têm tela de edição.

### `donations` (implementada)

Interesse do doador numa necessidade (RF06), nos dois lados: quem se oferece e
quem recebe, no detalhe da necessidade, mais o histórico do doador em
`/minhas-doacoes`.

| Arquivo | Papel |
|---|---|
| `components/DonorInterestSection.tsx` | o que o doador vê: botão "Tenho interesse", formulário e, depois, o que ele enviou (com cancelar) |
| `components/InterestForm.tsx` | mensagem (obrigatória), quantidade e prazo previstos |
| `components/NeedInterestsList.tsx` | o que a ONG dona vê: quem quer doar naquela necessidade |
| `pages/MyDonationsPage.tsx` | `/minhas-doacoes`: abas "Interesses" e "Instituições que sigo" (a segunda é o `FollowedOngsList` da feature `ongs`) |
| `components/MyInterestsList.tsx` | histórico dos interesses, com a necessidade, o status dela e a ONG |
| `model/interest.ts`, `model/schema.ts` | tipos `Interest` e `MyInterest` (com o embed da necessidade) e `interestSchema` |
| `services/interests.ts` | `fetchMyInterest`, `fetchMyInterests`, `fetchNeedInterests`, `createInterest`, `deleteInterest`, `interestErrorMessage` |
| `hooks/useInterests.ts`, `hooks/useInterestMutations.ts` | TanStack Query; toda escrita invalida `["interests"]` |

**Quem vê o quê:** o convite só aparece para doador (a policy de INSERT exige
`current_user_type() = 'donor'`) e some quando a necessidade já foi atendida ou
o prazo passou — mesma regra `isOpenForDonation` da busca. Quem já manifestou
continua vendo e podendo cancelar o que enviou, mesmo com a necessidade fechada.
A lista de interesses recebidos só aparece para a ONG dona; é a RLS que decide
o que volta, o componente não filtra nada.

**Histórico:** o `donorLoader` barra ONG e admin na rota. Os dois services
filtram por `donor_id` mesmo com a RLS, porque o admin enxerga as linhas de
todo mundo. Uma necessidade cuja ONG deixou de ser visível (recusada) volta com
o embed `null`: o interesse continua na lista como "Necessidade indisponível",
e a ONG some da lista de seguidas. Cancelar um interesse fica no detalhe da
necessidade, não na lista.

### `profile` (implementada)

`/perfil`, para os três papéis.

| Arquivo | Papel |
|---|---|
| `pages/ProfilePage.tsx` | seções "Seus dados", "Sua instituição" (só ONG: atalhos para o perfil público e os horários), "Privacidade" e o botão "Sair da conta" |
| `components/ProfileForm.tsx` | nome e telefone; o e-mail aparece só para leitura (vem da sessão, não de `profiles`) |
| `components/DeleteAccountSection.tsx` | exclusão da conta com confirmação; o texto diz o que some para cada papel |
| `model/schema.ts` | `profileSchema` |
| `services/account.ts` | `fetchAccountEmail` e `deleteOwnAccount` (RPC `delete_own_account` + `signOut` local) |
| `hooks/useAccount.ts` | `useAccountEmail`, `useUpdateProfile` (usa o `updateProfile` da `auth`) e `useDeleteAccount` (limpa o cache inteiro) |

**Exclusão de conta (RNF03/LGPD):** o client só consegue apagar `profiles`, e o
login em `auth.users` continuaria vivo. Por isso é a única RPC do app:
`delete_own_account()` (`SECURITY DEFINER`) apaga o usuário de `auth.users`, e o
`on delete cascade` leva perfil, ONG, necessidades, interesses, seguidas e
notificações. Admin não se exclui por aqui (a função recusa, e a tela nem
oferece).

**Sair no celular:** o MenuBar mobile não tem "Sair" (só o desktop tem), então
a saída mora no fim do perfil.

### Próximas features (pastas criadas, sem implementação)

| Feature | Escopo | Requisitos |
|---|---|---|
| `notifications` | avisos in-app das ONGs seguidas | RF09 |
| `admin` | aprovação/recusa de ONGs | RF08 |

## Decisões

- **Notificações via Supabase Realtime**, não polling: é o conceito central do
  produto (RF09). Subscription em `needs` (INSERT) filtrada pelas ONGs que o
  doador segue em `ong_followers`.
- **Sem PWA e sem web push nesta versão.** O layout continua mobile-first
  (RNF01) — isso é Tailwind, não PWA. Adicionar depois é plugin + manifest +
  ícones, sem retrabalho no resto.
- **Sem Sentry.** `src/lib/reportError.ts` só loga no console em DEV, mantendo
  a assinatura caso um serviço de erro entre depois.
- **Autorização 100% no banco (RLS)**, sem RPC: o cliente fala com as tabelas e
  as policies decidem. Ver `docs/SUPABASE.md`.
- **A ONG não vê quem é o doador, só a mensagem dele.** A policy de SELECT de
  `profiles` só devolve a própria linha, então nome e telefone de quem
  manifestou interesse são invisíveis para a instituição. Por isso a mensagem é
  obrigatória e o formulário pede o contato dentro dela. Para mostrar o nome de
  verdade seria preciso decidir o que expor e abrir isso na policy — decisão de
  privacidade, não só de código.
- **O perfil da ONG não mostra contagem de seguidores.** A policy de SELECT de
  `ong_followers` devolve só as linhas do próprio doador, então um total seria
  sempre 0 ou 1. Para exibir isso um dia seria preciso uma view/RPC agregada.
