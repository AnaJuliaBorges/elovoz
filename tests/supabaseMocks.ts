import type { Page, Route } from "@playwright/test";

export const EMAIL = "e2e@elovoz.test";
export const PASSWORD = "senha-e2e-123";
export const USER_ID = "e2e-user";

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

export const STATES = [{ id: "uuid-rj", name: "Rio de Janeiro", uf: "RJ" }];
export const CITIES = [
  { id: "uuid-rio", name: "Rio de Janeiro", state_id: "uuid-rj" },
];

export type ProfileRow = {
  id: string;
  user_type: "donor" | "ong" | "admin";
  name: string;
  phone: string | null;
  created_at: string;
};

export type MockOptions = {
  /** login com credenciais erradas */
  loginFails?: boolean;
  /** perfil que já existe no banco antes do teste */
  profile?: ProfileRow | null;
};

/** o que o banco fake gravou durante o teste */
export type MockState = {
  profile: ProfileRow | null;
  ongs: Record<string, unknown>[];
  contacts: Record<string, unknown>[];
};

export async function setupSupabaseMocks(
  page: Page,
  { loginFails = false, profile = null }: MockOptions = {},
): Promise<MockState> {
  const state: MockState = { profile, ongs: [], contacts: [] };

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
      await respondRows(route, [{ id: "ong-e2e" }]);
      return;
    }

    await respondRows(route, state.ongs.length ? [{ id: "ong-e2e" }] : []);
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

  return state;
}
