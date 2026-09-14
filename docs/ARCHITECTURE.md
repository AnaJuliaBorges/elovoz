# Arquitetura do Elovoz

Mapa das features e dos arquivos que cada uma toca. Mantenha atualizado quando
adicionar feature ou rota.

## Camadas

```
src/
├── main.tsx                 # todas as rotas, em um lugar só (createBrowserRouter)
├── App.tsx                  # elemento raiz: scroll reset + <Outlet /> + Toaster
├── index.css                # tokens do tema (Tailwind v4, @theme)
├── routes/guards.ts         # protectedLoader, publicOnlyLoader, ongLoader, adminLoader
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
| `/necessidades/:id` | AppLayout | `protectedLoader` | detalhe ✅ — falta o botão de interesse (RF06) |
| `/ongs/:id` | AppLayout | `protectedLoader` | placeholder (RF05, RF11) |
| `/painel` | AppLayout | `ongLoader` | necessidades da ONG + status ✅ (RF03, RF07) |
| `/painel/necessidades/nova`, `/painel/necessidades/:id/editar` | AppLayout | `ongLoader` | form de necessidade ✅ (RF03) |
| `/minhas-doacoes` | AppLayout | `protectedLoader` | placeholder (RF10) |
| `/notificacoes` | AppLayout | `protectedLoader` | placeholder (RF09) |
| `/perfil` | AppLayout | `protectedLoader` | placeholder |
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
| `services/profiles.ts` | ler/criar a linha em `profiles` |
| `services/signUp.ts` | cadastro de doador e de ONG, na ordem que a RLS exige |
| `services/passwordReset.ts` | `resetPasswordForEmail` + `updateUser` |
| `hooks/useProfile.ts` | perfil do usuário logado (TanStack Query) |
| `hooks/useLogin.ts`, `hooks/useLogout.ts` | entrar e sair |
| `signUp/store/useSignUpWizardStore.ts` | estado do wizard (Zustand + persist) |
| `signUp/hooks/useSignUpWizard.ts` | passo a passo, submits e erros |
| `signUp/steps/*` | `AccountStep`, `OngDataStep`, `OngContactStep`, `PendingReview` |

**Cadastro de doador:** 1 passo → `signUp` → `profiles` (`donor`) → vai para
`/necessidades`.

**Cadastro de ONG:** 3 passos (conta → dados institucionais → localização e
contato). As gravações só acontecem no fim, nesta ordem obrigatória:

```
auth.signUp → profiles (user_type='ong') → ongs (verification_status='pending') → ong_contacts
```

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
| `pages/CreateNeedPage.tsx`, `pages/EditNeedPage.tsx` | carregam os dados e só então montam o `NeedForm` (sem `reset()` tardio) |
| `components/NeedForm.tsx` | form de criar/editar |
| `components/NeedFiltersBar.tsx` | categoria, urgência, estado/cidade e bairro (com debounce) |
| `components/OngNeedItem.tsx` | linha do painel: select de status, editar, excluir com confirmação |
| `components/NeedCard.tsx`, `components/NeedBadges.tsx` | card da busca; badges de urgência e de status |
| `model/need.ts` | tipos, rótulos em português, `formatOngLocation` |
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

### `ongs` (parcial)

Por enquanto só `useMyOng` / `fetchMyOng`: a ONG do usuário logado (`id`,
`trade_name`, `verification_status`), usada pelo painel e pelo detalhe.

### Próximas features (pastas criadas, sem implementação)

| Feature | Escopo | Requisitos |
|---|---|---|
| `ongs` | perfil público da ONG, edição, seguir/deixar de seguir | RF05, RF11 |
| `donations` | interesse do doador e histórico | RF06, RF10 |
| `notifications` | avisos in-app das ONGs seguidas | RF09 |
| `admin` | aprovação/recusa de ONGs | RF08 |
| `profile` | dados da conta, preferências, exclusão (LGPD) | RNF03 |

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
