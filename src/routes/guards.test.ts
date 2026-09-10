import { supabase } from "@/lib/supabase";
import { fetchCurrentProfile } from "@/features/auth";
import type { Profile, UserType } from "@/features/auth";
import { adminLoader, ongLoader, protectedLoader, publicOnlyLoader } from "./guards";

vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { getSession: vi.fn() } },
}));

// só `fetchCurrentProfile` é mockado: `homeFor` continua real, é ele que
// define o destino de cada papel
vi.mock("@/features/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/auth")>()),
  fetchCurrentProfile: vi.fn(),
}));

const getSessionMock = vi.mocked(supabase.auth.getSession);
const fetchCurrentProfileMock = vi.mocked(fetchCurrentProfile);

function profileWith(userType: UserType): Profile {
  return {
    id: "user-1",
    user_type: userType,
    name: "Ana",
    phone: null,
    created_at: "2026-09-10T12:00:00Z",
  };
}

function mockSession(session: unknown) {
  getSessionMock.mockResolvedValue({ data: { session } } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("protectedLoader", () => {
  it("manda pro login quando não há sessão", async () => {
    mockSession(null);

    const response = await protectedLoader();

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).headers.get("Location")).toBe("/login");
  });

  it("deixa passar quando há sessão", async () => {
    mockSession({ user: { id: "user-1" } });

    await expect(protectedLoader()).resolves.toBeNull();
  });
});

describe("publicOnlyLoader", () => {
  it("deixa o visitante ver a página", async () => {
    mockSession(null);

    await expect(publicOnlyLoader()).resolves.toBeNull();
  });

  it.each([
    ["donor", "/necessidades"],
    ["ong", "/painel"],
    ["admin", "/admin"],
  ] as const)("redireciona %s logado para %s", async (userType, destination) => {
    mockSession({ user: { id: "user-1" } });
    fetchCurrentProfileMock.mockResolvedValue(profileWith(userType));

    const response = (await publicOnlyLoader()) as Response;

    expect(response.headers.get("Location")).toBe(destination);
  });
});

describe("adminLoader", () => {
  it("manda pro login sem perfil", async () => {
    fetchCurrentProfileMock.mockResolvedValue(null);

    const response = (await adminLoader()) as Response;

    expect(response.headers.get("Location")).toBe("/login");
  });

  it("devolve quem não é admin para a home do próprio papel", async () => {
    fetchCurrentProfileMock.mockResolvedValue(profileWith("ong"));

    const response = (await adminLoader()) as Response;

    expect(response.headers.get("Location")).toBe("/painel");
  });

  it("deixa o admin entrar", async () => {
    fetchCurrentProfileMock.mockResolvedValue(profileWith("admin"));

    await expect(adminLoader()).resolves.toBeNull();
  });
});

describe("ongLoader", () => {
  it("bloqueia doador no painel da ONG", async () => {
    fetchCurrentProfileMock.mockResolvedValue(profileWith("donor"));

    const response = (await ongLoader()) as Response;

    expect(response.headers.get("Location")).toBe("/necessidades");
  });

  it("deixa a ONG entrar", async () => {
    fetchCurrentProfileMock.mockResolvedValue(profileWith("ong"));

    await expect(ongLoader()).resolves.toBeNull();
  });

  it("manda pro login sem perfil", async () => {
    fetchCurrentProfileMock.mockResolvedValue(null);

    const response = (await ongLoader()) as Response;

    expect(response.headers.get("Location")).toBe("/login");
  });
});
