# Especificação Técnica — Elovoz

*Nome de produto (anteriormente "Conecta" na proposta acadêmica de Atividade Extensionista II).*

Plataforma de conexão entre doadores e instituições sociais, com divulgação de necessidades em tempo real.
Baseado na proposta de Atividade Extensionista II (UNINTER — Engenharia de Software).

---

## 1. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | React (Vite) + React Router | Exigido em RNF01 |
| Estilo | Tailwind CSS + shadcn/ui | Mobile-first (RNF01); shadcn/ui dá componentes acessíveis prontos (Radix UI por baixo), acelera formulários, modais, tabelas etc. |
| Backend / BaaS | Supabase | Postgres relacional, Auth pronta, Storage, Realtime |
| Autenticação | Supabase Auth | Já faz hash de senha internamente (atende RNF02) |
| Armazenamento de arquivos | Supabase Storage | Opcional por enquanto (sem documentação de verificação); útil futuramente para fotos de perfil/necessidades |
| Notificações em tempo real | Supabase Realtime (Postgres changes) | RF09 e o conceito central do projeto |
| Hospedagem frontend | Vercel ou Netlify | Atende RNF07 (nuvem, alta disponibilidade) |
| Hospedagem backend | Supabase Cloud | Gerenciado, já compatível com RNF07 |

---

## 2. Modelo de Dados (Postgres / Supabase)

O Supabase já cria a tabela `auth.users`. As demais tabelas ficam no schema `public` e se relacionam com ela.

### `profiles`
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid (PK, FK → auth.users.id) | |
| tipo_usuario | enum: `doador`, `ong`, `administrador` | Define papel de acesso |
| nome | text | |
| telefone | text | opcional |
| criado_em | timestamp | default now() |

### `ongs`
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| profile_id | uuid (FK → profiles.id) | dono da conta |
| nome_fantasia | text | obrigatório |
| razao_social | text | obrigatório |
| cnpj | text | obrigatório |
| missao | text | obrigatório |
| estado | text (UF) | obrigatório — select de 27 opções no front |
| municipio | text | obrigatório |
| bairro | text | obrigatório — usado na listagem/filtro de localização (RF04) |
| endereco | text | obrigatório |
| instagram | text | opcional |
| facebook | text | opcional |
| site | text | opcional |
| status_verificacao | enum: `pendente`, `aprovado`, `rejeitado` | RF08 |
| criado_em | timestamp | |

### `ong_contatos`
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| ong_id | uuid (FK → ongs.id) | |
| numero | text | obrigatório |
| whatsapp | boolean | default false — indica se o número recebe WhatsApp |

A ONG cadastra pelo menos um número; cada um marcado como WhatsApp ou não, pra exibir o ícone correto no perfil público (RF05).

### `categorias`
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| nome | text | |
| icone | text | opcional, nome/slug do ícone |

Seed inicial (10 categorias + "Outros"):
Roupas e Calçados, Alimentos, Itens de Saúde, Higiene Pessoal, Produtos de Limpeza, Itens Infantis, Material Escolar, Cobertores e Agasalhos, Brinquedos, Livros, Outros.

Manter numa tabela (em vez de enum fixo) permite que o administrador adicione ou edite categorias sem alterar código.

### `necessidades`
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| ong_id | uuid (FK → ongs.id) | |
| categoria_id | uuid (FK → categorias.id) | usada em filtros (RF04) |
| titulo | text | |
| descricao | text | |
| quantidade | integer | |
| urgencia | enum: `baixa`, `media`, `alta` | |
| prazo | date | |
| status | enum: `aberta`, `parcialmente_atendida`, `atendida` | RF07 |
| criado_em | timestamp | |
| atualizado_em | timestamp | |

### `interesses`
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| necessidade_id | uuid (FK → necessidades.id) | |
| doador_id | uuid (FK → profiles.id) | |
| mensagem | text | RF06 |
| quantidade_prevista | integer | opcional — quanto o doador pretende doar |
| prazo_previsto | date | opcional — até quando pretende doar |
| criado_em | timestamp | |

### `ong_seguidores`
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| doador_id | uuid (FK → profiles.id) | |
| ong_id | uuid (FK → ongs.id) | |
| criado_em | timestamp | |

Par único (`doador_id`, `ong_id`) — o doador segue a ONG e passa a receber notificações das necessidades dela especificamente.

### `notificacoes`
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| doador_id | uuid (FK → profiles.id) | |
| necessidade_id | uuid (FK → necessidades.id) | |
| lida | boolean | default false |
| criado_em | timestamp | RF09 |

---

## 3. Mapeamento RF → Implementação

| RF | Implementação no Supabase |
|---|---|
| RF01 | Formulário de cadastro de ONG (dados institucionais, sem upload de documentos) |
| RF02 | Supabase Auth (email/senha) + `profiles.tipo_usuario` para diferenciar papéis |
| RF03 | INSERT em `necessidades`, restrito por RLS à ONG dona |
| RF04 | SELECT com JOIN em `categorias` + filtros (`categoria_id`, `urgencia`, `localizacao`) + índices nessas colunas |
| RF05 | View pública combinando `ongs` + `necessidades` (RLS: só ONGs com status `aprovado`) |
| RF06 | INSERT em `interesses`, incluindo `quantidade_prevista` e `prazo_previsto` quando informados |
| RF07 | UPDATE em `necessidades.status`, restrito à ONG dona via RLS |
| RF08 | Painel admin: UPDATE em `ongs.status_verificacao`, restrito ao papel `administrador`. Sem documentação, a verificação é feita pelo admin a partir dos dados informados (ex.: conferir CNPJ em consulta pública, redes sociais, site) |
| RF09 | Supabase Realtime: subscription em `necessidades` (evento INSERT) filtrada pelas ONGs presentes em `ong_seguidores` do doador → grava em `notificacoes` |
| RF10 | SELECT em `necessidades` WHERE `status = 'atendida'` AND `ong_id = :id` |
| RF11 (novo) | Seguir ONG: INSERT/DELETE em `ong_seguidores` (toggle no perfil da ONG) |

---

## 4. Requisitos Não Funcionais → Como atender

- **RNF01** — React + Tailwind + shadcn/ui, com breakpoints mobile-first.
- **RNF02** — Resolvido pelo Supabase Auth (não implementar hash manualmente).
- **RNF03 (LGPD)** — Row Level Security em todas as tabelas com dados pessoais; política de privacidade visível; opção de exclusão de conta e dados; coletar apenas o necessário.
- **RNF04** — Índices em `categoria_id`, `urgencia`, `necessidades.ong_id`; paginação nas listagens.
- **RNF05** — Textos simples, ícones, poucos cliques até a ação principal; testar com usuários reais (já previsto no cronograma).
- **RNF06** — Evitar APIs experimentais do navegador; testar em Chrome, Firefox, Safari e Edge antes da entrega.
- **RNF07** — Deploy do frontend em Vercel/Netlify; backend no Supabase Cloud (SLA gerenciado).

---

## 5. Autenticação e Papéis

1. Cadastro cria registro em `auth.users` via Supabase Auth.
2. Um trigger (ou lógica no frontend, no primeiro login) cria a linha correspondente em `profiles`.
3. Se `tipo_usuario = ong`, o formulário pede dados extras e cria a linha em `ongs` com `status_verificacao = pendente`.
4. RLS policies usam `auth.uid()` combinado com `profiles.tipo_usuario` para liberar/bloquear cada operação.

---

## 6. Telas do Frontend

- Home / listagem de necessidades em destaque
- Login / Cadastro (doador ou ONG)
- Cadastro de ONG (dados institucionais e de contato)
- Painel da ONG (necessidades cadastradas, status, perfil)
- Cadastrar/editar necessidade
- Busca de necessidades (lista + filtros de categoria, urgência, localização)
- Perfil público da ONG (com botão de seguir)
- Painel do Administrador (aprovação de ONGs, gestão de usuários)
- Notificações do doador
- Minhas doações (histórico de interesses manifestados e ONGs seguidas)

---

## 7. Estrutura de Pastas Sugerida

```
elovoz/
├── src/
│   ├── components/
│   │   └── ui/           # componentes gerados pelo shadcn/ui (button, card, dialog etc.)
│   ├── pages/
│   ├── hooks/
│   ├── services/        # cliente Supabase e chamadas
│   ├── contexts/        # AuthContext
│   ├── routes/
│   └── lib/             # utils.ts (cn helper do shadcn/ui)
├── supabase/
│   ├── migrations/      # schema SQL das tabelas acima
│   └── policies/        # RLS policies
├── components.json      # config do shadcn/ui
└── README.md
```

---

## 8. Identidade Visual (provisória)

### Paleta de cores

| Token | Cor | Hex | Uso |
|---|---|---|---|
| Primária | Laranja Elo | `#F2723E` | Botões de ação, CTAs ("Tenho interesse", "Seguir ONG") |
| Secundária | Azul-petróleo | `#16535A` | Cabeçalho, navegação, elementos institucionais |
| Destaque | Amarelo | `#F4B942` | Badges, urgência **média** |
| Sucesso | Verde | `#4CAF50` | Urgência **baixa**, confirmações, status "atendida" |
| Alerta | Terracota | `#E4572E` | Urgência **alta**, ações críticas |
| Fundo | Off-white | `#FAFAF7` | Fundo geral da aplicação |
| Texto | Slate escuro | `#1F2933` | Texto principal |
| Borda/Muted | Bege claro | `#E5E1DA` | Bordas, divisores, fundo de cards secundários |

A coluna "Destaque/Sucesso/Alerta" já mapeia direto pro enum `urgencia` (`baixa`, `media`, `alta`) da tabela `necessidades` — dá pra usar essas cores nos badges de urgência na listagem (RF04).

O shadcn/ui usa variáveis CSS em HSL (`--primary`, `--background` etc. no `globals.css`). Os hex acima são a referência visual — converta pra HSL ao configurar o tema (o próprio gerador de tema do shadcn faz essa conversão).

### Logo provisória

Arquivo: `logo-elovoz-provisorio.svg` (anexo).

![Logo Elovoz](./logo-elovoz-provisorio.svg)

Conceito: duas argolas entrelaçadas (o "elo") com uma onda sonora na interseção (a "voz"), em laranja e azul-petróleo da paleta acima. É um placeholder pra já ter algo visual no protótipo — vale substituir por uma versão desenhada por um designer antes da entrega final.

---

## 9. Ordem sugerida de implementação

1. Criar projeto no Supabase e rodar as migrations do schema (seção 2).
2. Escrever as RLS policies antes de qualquer tela (segurança desde o início).
3. Implementar autenticação e fluxo de cadastro (doador/ONG).
4. CRUD de necessidades (RF03, RF04, RF07).
5. Perfil público da ONG e busca com filtros (RF05, RF04).
6. Interesse/contato do doador (RF06) e realtime de notificações (RF09).
7. Painel do administrador (RF08, RF10).
8. Testes com ONGs e ajustes finais (conforme cronograma da proposta).
