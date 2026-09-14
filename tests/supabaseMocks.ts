import type { Page, Route } from "@playwright/test";

export const EMAIL = "e2e@elovoz.test";
export const PASSWORD = "senha-e2e-123";
export const USER_ID = "e2e-user";
export const ONG_ID = "ong-e2e";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "*",
  "access-control-expose-headers": "content-range",
};

const nowIso = new Date().toISOString();

export const fakeUser = {
  id: USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: EMAIL,
  email_confirmed_at: nowIso,
  phone: "",
  confirmed_at: nowIso,
  last_sign_in_at: nowIso,
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  identities: [],
  created_at: nowIso,
  updated_at: nowIso,
};

function fakeJwt() {
  const encode = (payload: object) =>
    Buffer.from(JSON.stringify(payload)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({
    sub: USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: EMAIL,
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  return `${header}.${body}.assinatura-fake`;
}

export const fakeSession = {
  access_token: fakeJwt(),
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "refresh-fake",
  user: fakeUser,
};

export function jsonResponse(body: unknown, status = 200) {
  return {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function preflight(route: Route) {
  await route.fulfill({ status: 204, headers: corsHeaders });
}

/**
 * O PostgREST devolve objeto (e não lista) quando o supabase-js pede
 * `.single()` / `.maybeSingle()` — o Accept da requisição diz qual é o caso.
 */
async function respondRows(route: Route, rows: unknown[]) {
  const accept = route.request().headers()["accept"] ?? "";

  if (accept.includes("vnd.pgrst.object+json")) {
    await route.fulfill(jsonResponse(rows[0] ?? null));
    return;
  }

  await route.fulfill(jsonResponse(rows));
}

export async function login(page: Page) {
  await page.getByRole("textbox", { name: "E-mail" }).fill(EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
}

/** Radix Select: abre pelo trigger e escolhe a opção pelo nome exato */
export async function chooseOption(page: Page, trigger: string, option: string) {
  await page.getByRole("combobox", { name: trigger }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

export const STATES = [{ id: "uuid-rj", name: "Rio de Janeiro", uf: "RJ" }];
export const CITIES = [
  { id: "uuid-rio", name: "Rio de Janeiro", state_id: "uuid-rj" },
];

export const CATEGORIES = [
  { id: "cat-alimentos", name: "Alimentos", icon: null },
  { id: "cat-roupas", name: "Roupas e Calçados", icon: null },
];

export type ProfileRow = {
  id: string;
  user_type: "donor" | "ong" | "admin";
  name: string;
  phone: string | null;
  created_at: string;
};

export type OngRow = {
  id: string;
  trade_name: string;
  verification_status: "pending" | "approved" | "rejected";
};

export type NeedRow = {
  id: string;
  ong_id: string;
  category_id: string;
  title: string;
  description: string | null;
  quantity: number | null;
  urgency: "low" | "medium" | "high";
  deadline: string | null;
  status: "open" | "partially_fulfilled" | "fulfilled";
  created_at: string;
  updated_at: string;
  category: { id: string; name: string } | null;
  ong: {
    id: string;
    trade_name: string;
    neighborhood: string;
    city: { name: string } | null;
    state: { uf: string } | null;
  };
};

/** Linha de `needs` já com os embeds que a busca e o detalhe pedem. */
export function needRow(overrides: Partial<NeedRow> = {}): NeedRow {
  return {
    id: "need-1",
    ong_id: ONG_ID,
    category_id: "cat-alimentos",
    title: "Cestas básicas",
    description: "Para 30 famílias do bairro",
    quantity: 30,
    urgency: "high",
    deadline: null,
    status: "open",
    created_at: nowIso,
    updated_at: nowIso,
    category: { id: "cat-alimentos", name: "Alimentos" },
    ong: {
      id: ONG_ID,
      trade_name: "Casa Solidária",
      neighborhood: "Centro",
      city: { name: "Rio de Janeiro" },
      state: { uf: "RJ" },
    },
    ...overrides,
  };
}

// filtros `coluna=eq.valor` que o mock entende; os outros (status, prazo,
// embeds) passam direto
const NEED_EQ_FILTERS = ["id", "ong_id", "category_id", "urgency"] as const;

function filterNeeds(rows: NeedRow[], url: URL): NeedRow[] {
  return rows.filter((row) =>
    NEED_EQ_FILTERS.every((column) => {
      const filter = url.searchParams.get(column);

      return !filter?.startsWith("eq.") || String(row[column]) === filter.slice(3);
    }),
  );
}

export type MockOptions = {
  /** login com credenciais erradas */
  loginFails?: boolean;
  /** perfil que já existe no banco antes do teste */
  profile?: ProfileRow | null;
  /** ONG do usuário logado que já existe no banco */
  ong?: OngRow | null;
  /** necessidades que já existem no banco */
  needs?: NeedRow[];
};

/** o que o banco fake gravou durante o teste */
export type MockState = {
  profile: ProfileRow | null;
  ongs: Record<string, unknown>[];
  contacts: Record<string, unknown>[];
  needs: NeedRow[];
  /** corpos dos INSERTs em `needs`, como o app mandou */
  insertedNeeds: Record<string, unknown>[];
  /** URLs dos GETs em `needs`, para conferir os filtros */
  needRequests: string[];
};

export async function setupSupabaseMocks(
  page: Page,
  { loginFails = false, profile = null, ong = null, needs = [] }: MockOptions = {},
): Promise<MockState> {
  const state: MockState = {
    profile,
    ongs: [],
    contacts: [],
    needs: [...needs],
    insertedNeeds: [],
    needRequests: [],
  };

  await page.route("**/auth/v1/token*", async (route) => {
    if (route.request().method() === "OPTIONS") return preflight(route);

    if (loginFails) {
      await route.fulfill(
        jsonResponse(
          {
            code: 400,
            error_code: "invalid_credentials",
            msg: "Invalid login credentials",
          },
          400,
        ),
      );
      return;
    }

    await route.fulfill(jsonResponse(fakeSession));
  });

  await page.route("**/auth/v1/signup*", async (route) => {
    if (route.request().method() === "OPTIONS") return preflight(route);
    await route.fulfill(jsonResponse(fakeSession));
  });

  await page.route("**/auth/v1/recover*", async (route) => {
    if (route.request().method() === "OPTIONS") return preflight(route);
    await route.fulfill(jsonResponse({}));
  });

  await page.route("**/auth/v1/user*", async (route) => {
    if (route.request().method() === "OPTIONS") return preflight(route);
    await route.fulfill(jsonResponse(fakeUser));
  });

  // as rotas específicas abaixo precisam vir DEPOIS deste catch-all: no
  // Playwright, a última rota registrada é a que ganha
  await page.route("**/rest/v1/**", async (route) => {
    if (route.request().method() === "OPTIONS") return preflight(route);
    await route.fulfill(jsonResponse([]));
  });

  await page.route("**/rest/v1/states*", async (route) => {
    if (route.request().method() === "OPTIONS") return preflight(route);
    await respondRows(route, STATES);
  });

  await page.route("**/rest/v1/cities*", async (route) => {
    if (route.request().method() === "OPTIONS") return preflight(route);
    await respondRows(route, CITIES);
  });

  await page.route("**/rest/v1/categories*", async (route) => {
    if (route.request().method() === "OPTIONS") return preflight(route);
    await respondRows(route, CATEGORIES);
  });

  await page.route("**/rest/v1/profiles*", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return preflight(route);

    if (request.method() === "POST") {
      const body = request.postDataJSON() as Omit<ProfileRow, "created_at">;
      state.profile = { ...body, created_at: nowIso };
      await route.fulfill({ status: 201, headers: corsHeaders, body: "" });
      return;
    }

    await respondRows(route, state.profile ? [state.profile] : []);
  });

  await page.route("**/rest/v1/ongs*", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return preflight(route);

    if (request.method() === "POST") {
      const body = request.postDataJSON() as Record<string, unknown>;
      state.ongs.push(body);
      await respondRows(route, [{ id: ONG_ID }]);
      return;
    }

    if (state.ongs.length) {
      await respondRows(route, [{ id: ONG_ID }]);
      return;
    }

    await respondRows(route, ong ? [ong] : []);
  });

  await page.route("**/rest/v1/ong_contacts*", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return preflight(route);

    if (request.method() === "POST") {
      const body = request.postDataJSON() as Record<string, unknown>[];
      state.contacts.push(...body);
      await route.fulfill({ status: 201, headers: corsHeaders, body: "" });
      return;
    }

    // `select(..., { count: "exact", head: true })` vira HEAD + content-range
    await route.fulfill({
      status: 200,
      headers: {
        ...corsHeaders,
        "content-range": `*/${state.contacts.length}`,
      },
      body: "",
    });
  });

  await page.route("**/rest/v1/needs*", async (route) => {
    const request = route.request();
    const method = request.method();
    if (method === "OPTIONS") return preflight(route);

    const url = new URL(request.url());

    if (method === "POST") {
      const body = request.postDataJSON() as Partial<NeedRow>;
      const category = CATEGORIES.find((item) => item.id === body.category_id);
      const row = needRow({
        ...body,
        id: `need-novo-${state.insertedNeeds.length + 1}`,
        category: category ? { id: category.id, name: category.name } : null,
      });

      state.insertedNeeds.push(body);
      state.needs.unshift(row);
      await respondRows(route, [{ id: row.id }]);
      return;
    }

    const rows = filterNeeds(state.needs, url);

    if (method === "PATCH") {
      const body = request.postDataJSON() as Partial<NeedRow>;
      rows.forEach((row) => Object.assign(row, body));
      await respondRows(route, rows.map((row) => ({ id: row.id })));
      return;
    }

    if (method === "DELETE") {
      state.needs = state.needs.filter((row) => !rows.includes(row));
      await respondRows(route, rows.map((row) => ({ id: row.id })));
      return;
    }

    state.needRequests.push(request.url());

    if ((request.headers()["accept"] ?? "").includes("vnd.pgrst.object+json")) {
      await respondRows(route, rows);
      return;
    }

    // `count: "exact"` lê o total do content-range
    await route.fulfill({
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
        "content-range": rows.length
          ? `0-${rows.length - 1}/${rows.length}`
          : "*/0",
      },
      body: JSON.stringify(rows),
    });
  });

  return state;
}
