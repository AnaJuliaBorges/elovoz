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
│   ├── layout/              # LayoutWrapper, MenuBar, RouteError
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
| `/privacidade` | AuthLayout | — (pública para todos) | política de privacidade ✅ (RNF03) |
| `/necessidades` | AppLayout | `protectedLoader` | busca com filtros ✅ (RF04) |
| `/necessidades/:id` | AppLayout | `protectedLoader` | detalhe + manifestar interesse ✅ (RF06) |
| `/ongs/:id` | AppLayout | `protectedLoader` | perfil público + seguir ✅ (RF05, RF11) |
| `/painel` | AppLayout | `ongLoader` | necessidades da ONG + status ✅ (RF03, RF07) |
| `/painel/necessidades/nova`, `/painel/necessidades/:id/editar` | AppLayout | `ongLoader` | form de necessidade ✅ (RF03) |
| `/painel/horarios` | AppLayout | `ongLoader` | horários de funcionamento da ONG ✅ |
| `/painel/dados` | AppLayout | `ongLoader` | edição dos dados da instituição ✅ (RF05) |
| `/minhas-doacoes` | AppLayout | `donorLoader` | histórico de interesses + ONGs seguidas ✅ (RF06, RF11) |
| `/notificacoes` | AppLayout | `donorLoader` | avisos de novas necessidades das ONGs seguidas ✅ (RF09) |
| `/perfil` | AppLayout | `protectedLoader` | dados da conta, privacidade, exclusão de conta e sair ✅ (RNF03) |
| `/admin` | AppLayout | `adminLoader` | verificação de ONGs: aprovar, recusar, revogar ✅ (RF08) |

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
| `model/schema.ts` | schemas zod dos formulários de conta; os da instituição (`ongDataSchema`, `ongContactSchema`) são da feature `ongs` e só são re-exportados aqui |
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

### `ongs` (implementada)

Perfil público da instituição e seguir/deixar de seguir (RF05, RF11), mais o
`useMyOng` que o painel usa.

| Arquivo | Papel |
|---|---|
| `pages/OngProfilePage.tsx` | perfil: missão, contato, endereço e as necessidades da ONG |
| `components/FollowOngButton.tsx` | toggle seguir/seguindo; só aparece para doador |
| `components/OngContacts.tsx` | telefones (WhatsApp vai pro `wa.me`, fixo pro discador) e redes |
| `model/ong.ts` | `MyOng`, `OngProfile`, `OngForReview`, `FollowedOng`, `OngContact`, formatação de endereço e links das redes |
| `services/ongs.ts` | `fetchMyOng` (por `profile_id`), `fetchOngProfile` (por `id`, com embeds) e, para o admin, `fetchOngsForReview` e `setOngVerificationStatus` |
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

**Edição dos dados (`/painel/dados`):** duas seções, cada uma com o próprio
botão de salvar. "Identificação" edita nome fantasia e missão; razão social e
CNPJ aparecem travados, porque são o que o admin conferiu para aprovar a ONG
(corrigir passa pela equipe). "Endereço e contatos" reaproveita o
`OngContactForm` do cadastro; salvar grava o endereço e as redes em `ongs` e
substitui os telefones inteiros (apaga e regrava, como os horários). Toda
escrita invalida `["ongs"]`, `["my-ong"]` e `["needs"]`, porque o nome e o
bairro também aparecem no painel e nos cards da busca.

| Arquivo | Papel |
|---|---|
| `pages/OngDataPage.tsx` | `/painel/dados` |
| `components/OngIdentityForm.tsx` | nome fantasia e missão, com razão social e CNPJ só para leitura |
| `components/OngContactForm.tsx` | endereço, telefones e redes; exportado para o passo do cadastro, que só o envolve com "Voltar"/"Continuar" |
| `model/ongForm.ts` | `ongIdentitySchema`, `ongDataSchema` (= identificação + razão social e CNPJ), `ongContactSchema` e `toOngForms` (banco → formulários) |
| `hooks/useOngData.ts` | `useOngForEdit`, `useUpdateOngIdentity`, `useUpdateOngContact` |

**Por que os schemas moram aqui:** o cadastro (`auth`) e o painel editam os
mesmos dados. `auth` e `ongs` se importam mutuamente pelo barrel, então
`auth/model/schema.ts` só re-exporta, sem usar os schemas no topo do módulo.
Um `.extend()` ali quebraria na inicialização quando `ongs` carregasse primeiro.

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
| `pages/ProfilePage.tsx` | seções "Seus dados", "Sua instituição" (só ONG: itens que levam a `/painel/dados`, `/painel/horarios` e ao perfil público), "Privacidade" e o botão "Sair da conta" |
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

**Editar a instituição:** tudo que a ONG edita sobre ela mesma (dados e
horários) tem entrada só pelo Perfil; o painel (`/painel`) fica só com as
necessidades. As telas continuam em `/painel/dados` e `/painel/horarios`, e o
"Voltar" delas volta para o Perfil.

**Sair no celular:** o MenuBar mobile não tem "Sair" (só o desktop tem), então
a saída mora no fim do perfil.

### `admin` (implementada)

`/admin`: verificação das ONGs (RF08). Os services ficam no agregado
`ongs/services/ongs.ts` e chegam pelo barrel de `ongs`; aqui mora só a tela.

| Arquivo | Papel |
|---|---|
| `pages/AdminOngsPage.tsx` | abas Pendentes / Aprovadas / Recusadas, com a contagem de cada uma |
| `components/OngReviewCard.tsx` | o que dá para conferir sem documentos: CNPJ, razão social, responsável (nome e telefone), endereço, contatos, redes e missão, mais as ações |
| `model/review.ts` | `VERIFICATION_TABS`, `groupByStatus` e `ACTIONS_BY_STATUS` (o que cada status permite) |
| `hooks/useOngReview.ts` | `useOngsForReview` e `useSetOngStatus` |

**Ações por status:** pendente → aprovar ou recusar; aprovada → revogar (vira
`rejected`); recusada → aprovar. O que tira a ONG do ar (recusar, revogar) pede
confirmação; aprovar não. Mudar o status invalida a fila e também tudo de
`["ongs"]` e `["needs"]`, porque muda o que o perfil público e a busca devolvem.

**Uma consulta só:** a fila vem inteira (todas as ONGs, das mais antigas para
as mais novas) e é separada por status no client. São poucas ONGs, e assim as
abas mostram as contagens sem consultas extras. Se o volume crescer, trocar por
consulta por status com `count`.

**Responsável:** o embed `responsible:profiles(name, phone)` só volta
preenchido para o admin, porque `profiles` é legível só pelo dono ou pelo
admin. O e-mail não aparece: ele mora em `auth.users`, fora do alcance do
client.

**Falta:** a "gestão de usuários" que a especificação cita junto do painel.

### `legal` (implementada)

`/privacidade`: a política de privacidade (RNF03/LGPD), pública, com link na
home, no cadastro (abre em outra aba para não perder o formulário) e na seção
"Privacidade" do perfil. `model/privacy.ts` guarda o e-mail de contato do
responsável pelos dados e a data da última atualização. **Ao mudar o que é
coletado ou quem vê o quê, atualize o texto e a data.**

### `notifications` (implementada)

Avisos de nova necessidade das ONGs que o doador segue (RF09).

| Arquivo | Papel |
|---|---|
| `pages/NotificationsPage.tsx` | `/notificacoes`: lista com os não lidos destacados, abrir marca como lido, "Marcar todos como lidos" |
| `model/notification.ts` | `AppNotification`, com o embed da necessidade e da ONG |
| `services/notifications.ts` | `fetchNotifications` (os 50 mais novos), `markNotificationRead`, `markAllNotificationsRead`, `subscribeToNewNotifications` (Realtime) |
| `hooks/useNotifications.ts` | `useNotifications`, `useUnreadNotificationsCount`, as duas mutações e `useNotificationsRealtime`; os dois primeiros e o Realtime saem pelo barrel para o MenuBar |

**Quem grava o aviso é o banco.** O trigger `notify_followers_on_new_need`
(em `needs`, AFTER INSERT) insere uma linha em `notifications` para cada
seguidor da ONG, então o aviso existe mesmo com o doador offline. O client não
tem policy de INSERT na tabela: só lê e marca como lido.

**O Realtime só acorda o app.** O MenuBar do doador assina INSERT em
`notifications` filtrado pelo próprio `donor_id`; cada evento invalida
`["notifications"]` e mostra um toast com "Ver". O contador do menu é um
`select` sobre a mesma consulta da tela, sem ida extra ao banco.

## Decisões

- **Notificações: trigger grava, Realtime avisa** (RF09). A especificação
  sugeria o client escutar `needs` e gravar em `notifications`, mas aí o aviso
  só existiria para quem estivesse com o app aberto, e a tabela nem aceita
  INSERT do client. O trigger grava para todos os seguidores; o Realtime em
  `notifications` só atualiza o app aberto, sem polling.
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
