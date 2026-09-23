import { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  createQueryBuilder,
  type QueryBuilderMock,
} from "@/test/supabaseQueryBuilder";
import { createProfile, fetchProfile } from "./profiles";
import { registerDonor, registerOng, SignUpError } from "./signUp";
import type { AccountFormInput } from "../model/schema";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    auth: { signUp: vi.fn(), signInWithPassword: vi.fn() },
  },
}));

vi.mock("./profiles", () => ({
  fetchProfile: vi.fn(),
  createProfile: vi.fn(),
}));

const fromMock = vi.mocked(supabase.from);
const signUpMock = vi.mocked(supabase.auth.signUp);
const signInMock = vi.mocked(supabase.auth.signInWithPassword);
const fetchProfileMock = vi.mocked(fetchProfile);
const createProfileMock = vi.mocked(createProfile);

const account: AccountFormInput = {
  user_type: "ong",
  name: "Ana",
  email: "ana@exemplo.com",
  password: "senha-forte-1",
  passwordConfirmation: "senha-forte-1",
  phone: "(21) 99876-5432",
};

const ongData = {
  trade_name: "Casa Solidária",
  legal_name: "Associação Casa Solidária",
  cnpj: "11.222.333/0001-81",
  mission: "Distribuir alimentos para famílias em situação de rua.",
};

const contact = {
  state_id: "uuid-rj",
  city_id: "uuid-rio",
  neighborhood: "Centro",
  address: "Rua das Flores, 100",
  contacts: [{ number: "(21) 99876-5432", whatsapp: true }],
  instagram: "",
  facebook: "",
  website: "",
};

const hours = [{ weekday: 1 as const, opens_at: "09:00", closes_at: "17:00" }];

/** entrega um builder diferente a cada chamada de `from(tabela)` */
function mockTables(tables: Record<string, QueryBuilderMock[]>) {
  fromMock.mockImplementation((table: string) => {
    const queue = tables[table];
    if (!queue?.length) throw new Error(`from("${table}") inesperado`);
    return (queue.length > 1 ? queue.shift()! : queue[0]) as never;
  });
}

function accountCreated() {
  signUpMock.mockResolvedValue({
    data: { user: { id: "user-1" }, session: { access_token: "token" } },
    error: null,
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  // clearAllMocks zera as chamadas, não as implementações: os mocks de
  // profiles precisam voltar ao "caminho feliz" a cada teste
  fetchProfileMock.mockResolvedValue(null);
  createProfileMock.mockResolvedValue(undefined);
});

describe("registerDonor", () => {
  it("cria a conta e o perfil como donor", async () => {
    accountCreated();

    await expect(registerDonor({ ...account, user_type: "donor" })).resolves.toBe(
      "user-1",
    );

    expect(signUpMock).toHaveBeenCalledWith({
      email: account.email,
      password: account.password,
    });
    expect(createProfileMock).toHaveBeenCalledWith({
      id: "user-1",
      name: "Ana",
      phone: "(21) 99876-5432",
      user_type: "donor",
    });
  });

  it("não recria a conta quando a tentativa anterior já criou", async () => {
    await registerDonor({ ...account, user_type: "donor" }, "user-1");

    expect(signUpMock).not.toHaveBeenCalled();
    expect(createProfileMock).toHaveBeenCalled();
  });

  it("não regrava o perfil que já existe", async () => {
    fetchProfileMock.mockResolvedValue({
      id: "user-1",
      user_type: "donor",
      name: "Ana",
      phone: null,
      created_at: "2026-09-10T12:00:00Z",
    });

    await registerDonor({ ...account, user_type: "donor" }, "user-1");

    expect(createProfileMock).not.toHaveBeenCalled();
  });

  it("traduz e-mail já cadastrado", async () => {
    signUpMock.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthError("User already registered", 422, "user_already_exists"),
    } as never);

    await expect(
      registerDonor({ ...account, user_type: "donor" }),
    ).rejects.toThrow(/Já existe uma conta com esse e-mail/);
  });

  it("avisa quando a conta foi criada mas a sessão não abriu", async () => {
    signUpMock.mockResolvedValue({
      data: { user: { id: "user-1" }, session: null },
      error: null,
    } as never);
    signInMock.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthError("Email not confirmed", 400, "email_not_confirmed"),
    } as never);

    const error = await registerDonor({
      ...account,
      user_type: "donor",
    }).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(SignUpError);
    expect((error as SignUpError).stage).toBe("account");
    expect((error as SignUpError).message).toMatch(/confirmação de e-mail/);
  });

  it("marca o estágio `profile` quando o INSERT do perfil falha", async () => {
    accountCreated();
    createProfileMock.mockRejectedValue(new Error("violates RLS"));

    const error = await registerDonor({
      ...account,
      user_type: "donor",
    }).catch((err: unknown) => err);

    expect((error as SignUpError).stage).toBe("profile");
  });
});

describe("registerOng", () => {
  it("grava perfil, ONG e contatos na ordem que a RLS exige", async () => {
    accountCreated();

    const ongLookup = createQueryBuilder({ data: null });
    const ongInsert = createQueryBuilder({ data: { id: "ong-1" } });
    const contactsCount = createQueryBuilder({ count: 0 });
    const contactsInsert = createQueryBuilder();
    const hoursCount = createQueryBuilder({ count: 0 });
    const hoursInsert = createQueryBuilder();

    mockTables({
      ongs: [ongLookup, ongInsert],
      ong_contacts: [contactsCount, contactsInsert],
      ong_opening_hours: [hoursCount, hoursInsert],
    });

    await expect(
      registerOng({ account, data: ongData, contact, hours }),
    ).resolves.toBe("user-1");

    // o perfil precisa existir antes: `ongs_insert_own` chama current_user_type()
    expect(createProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_type: "ong" }),
    );
    expect(ongInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_id: "user-1",
        cnpj: "11222333000181",
        state_id: "uuid-rj",
        city_id: "uuid-rio",
        verification_status: "pending",
        instagram: null,
      }),
    );
    expect(contactsInsert.insert).toHaveBeenCalledWith([
      { ong_id: "ong-1", number: "21998765432", whatsapp: true },
    ]);
    expect(hoursInsert.insert).toHaveBeenCalledWith([
      { ong_id: "ong-1", weekday: 1, opens_at: "09:00", closes_at: "17:00" },
    ]);
  });

  it("não toca em `ong_opening_hours` quando nenhum dia foi marcado", async () => {
    accountCreated();

    mockTables({
      ongs: [
        createQueryBuilder({ data: null }),
        createQueryBuilder({ data: { id: "ong-1" } }),
      ],
      ong_contacts: [createQueryBuilder({ count: 0 }), createQueryBuilder()],
    });

    await expect(
      registerOng({ account, data: ongData, contact, hours: [] }),
    ).resolves.toBe("user-1");
  });

  it("marca o estágio `hours` quando o INSERT dos horários falha", async () => {
    accountCreated();

    mockTables({
      ongs: [
        createQueryBuilder({ data: null }),
        createQueryBuilder({ data: { id: "ong-1" } }),
      ],
      ong_contacts: [createQueryBuilder({ count: 0 }), createQueryBuilder()],
      ong_opening_hours: [
        createQueryBuilder({ count: 0 }),
        createQueryBuilder({ error: new Error("violates RLS") }),
      ],
    });

    const error = await registerOng({
      account,
      data: ongData,
      contact,
      hours,
    }).catch((err: unknown) => err);

    expect((error as SignUpError).stage).toBe("hours");
  });

  it("reaproveita a ONG já criada numa tentativa anterior", async () => {
    const ongLookup = createQueryBuilder({ data: { id: "ong-1" } });
    const contactsCount = createQueryBuilder({ count: 1 });
    const hoursCount = createQueryBuilder({ count: 1 });

    mockTables({
      ongs: [ongLookup],
      ong_contacts: [contactsCount],
      ong_opening_hours: [hoursCount],
    });

    await registerOng({
      account,
      data: ongData,
      contact,
      hours,
      existingUserId: "user-1",
    });

    expect(signUpMock).not.toHaveBeenCalled();
    expect(ongLookup.insert).not.toHaveBeenCalled();
    expect(contactsCount.insert).not.toHaveBeenCalled();
    expect(hoursCount.insert).not.toHaveBeenCalled();
  });

  it("marca o estágio `ong` quando o INSERT da ONG falha", async () => {
    accountCreated();

    mockTables({
      ongs: [
        createQueryBuilder({ data: null }),
        createQueryBuilder({ error: new Error("violates RLS") }),
      ],
    });

    const error = await registerOng({
      account,
      data: ongData,
      contact,
      hours,
    }).catch((err: unknown) => err);

    expect((error as SignUpError).stage).toBe("ong");
  });

  it("marca o estágio `contacts` quando o INSERT dos telefones falha", async () => {
    accountCreated();

    mockTables({
      ongs: [
        createQueryBuilder({ data: null }),
        createQueryBuilder({ data: { id: "ong-1" } }),
      ],
      ong_contacts: [
        createQueryBuilder({ count: 0 }),
        createQueryBuilder({ error: new Error("violates RLS") }),
      ],
    });

    const error = await registerOng({
      account,
      data: ongData,
      contact,
      hours,
    }).catch((err: unknown) => err);

    expect((error as SignUpError).stage).toBe("contacts");
  });
});
