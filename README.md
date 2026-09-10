# Elovoz

Plataforma que conecta doadores a instituições sociais: as ONGs divulgam o que
estão precisando agora, e quem quer doar encontra a necessidade que consegue
atender. SPA em React + Vite com backend no Supabase.

Baseado na proposta de Atividade Extensionista (UNINTER — Engenharia de
Software). A especificação completa está em [docs/especificacao-tecnica.md](docs/especificacao-tecnica.md).

## Setup

```bash
npm install
cp .env.example .env   # preencha com as chaves do seu projeto Supabase
npm run dev            # http://localhost:5173
```

Variáveis de ambiente (`.env`, não versionado):

| Variável | Onde achar |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → chave publishable/anon |

> Os testes não dependem dessas chaves: o Vitest usa valores fake definidos em
> `vite.config.ts` (`test.env`) e o Playwright intercepta toda a rede com
> `page.route`.

## Comandos

```bash
npm run dev              # servidor de desenvolvimento
npm run build            # typecheck + build de produção
npm run typecheck        # tsc -b
npm run lint             # eslint (zero warnings)
npm run preview          # serve o build

npm run test             # vitest em watch
npm run test:coverage    # vitest com cobertura (80% linhas/funções/statements, 70% branches)

npm run test:e2e         # playwright (sobe o dev server sozinho)
npm run test:e2e:ui      # playwright em modo UI
npm run test:e2e:report  # abre o último relatório
```

Rodar um teste só: `npx vitest run src/lib/masks.test.ts` /
`npx playwright test tests/auth.spec.tsx`.

## Estado atual

Esta é a base do projeto: infraestrutura, tema, shell de rotas e a feature de
autenticação (login, cadastro de doador, cadastro de ONG em 3 passos,
recuperação de senha). As telas de necessidades, ONGs, doações, notificações e
admin existem como rotas com placeholder — cada uma tem sua pasta em
`src/features/`, pronta para receber a implementação.

Detalhes de arquitetura em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) e do
banco em [docs/SUPABASE.md](docs/SUPABASE.md).

## Pendências de configuração

- [ ] **Desligar a confirmação de e-mail** no Supabase (Authentication →
      Sign In / Providers). O cadastro grava a linha em `profiles` logo depois
      do `signUp`, e sem sessão ativa a RLS bloqueia esse INSERT.
- [ ] **Rodar `supabase/sql/fix_user_type_on_insert.sql`** no SQL Editor: sem
      ele, dá para se cadastrar como `admin` direto pelo client.
