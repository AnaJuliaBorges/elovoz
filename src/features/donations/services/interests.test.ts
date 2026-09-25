import { supabase } from "@/lib/supabase";
import { createQueryBuilder } from "@/test/supabaseQueryBuilder";
import {
  createInterest,
  deleteInterest,
  fetchMyInterest,
  fetchMyInterests,
  fetchNeedInterests,
  interestErrorMessage,
  setInterestAnswered,
} from "./interests";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: { getSession: vi.fn() },
  },
}));

const fromMock = vi.mocked(supabase.from);
const getSessionMock = vi.mocked(supabase.auth.getSession);

const interest = {
  id: "interest-1",
  need_id: "need-1",
  donor_id: "donor-1",
  message: "Tenho 10 cestas, falo pelo (21) 99999-1234",
  expected_quantity: 10,
  expected_deadline: "2026-12-20",
  created_at: "2026-09-20T12:00:00Z",
};

// a data chega do formulário como DD/MM/AAAA e sai para o banco como AAAA-MM-DD
const values = {
  message: "Tenho 10 cestas, falo pelo (21) 99999-1234",
  expected_quantity: "10",
  expected_deadline: "20/12/2026",
  share_contact: true,
};

function withSession() {
  getSessionMock.mockResolvedValue({
    data: { session: { user: { id: "donor-1" } } },
  } as never);
}

function withoutSession() {
  getSessionMock.mockResolvedValue({ data: { session: null } } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchMyInterest", () => {
  it("busca o interesse do doador logado nessa necessidade", async () => {
    withSession();
    const builder = createQueryBuilder({ data: interest });
    fromMock.mockReturnValue(builder as never);

    await expect(fetchMyInterest("need-1")).resolves.toEqual(interest);

    expect(fromMock).toHaveBeenCalledWith("interests");
    expect(builder.eq).toHaveBeenCalledWith("need_id", "need-1");
    expect(builder.eq).toHaveBeenCalledWith("donor_id", "donor-1");
    expect(builder.maybeSingle).toHaveBeenCalled();
  });

  it("devolve null sem sessão, sem consultar o banco", async () => {
    withoutSession();

    await expect(fetchMyInterest("need-1")).resolves.toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("devolve null quando ainda não manifestou", async () => {
    withSession();
    fromMock.mockReturnValue(createQueryBuilder({ data: null }) as never);

    await expect(fetchMyInterest("need-1")).resolves.toBeNull();
  });

  it("propaga erro do supabase", async () => {
    withSession();
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("RLS") }) as never,
    );

    await expect(fetchMyInterest("need-1")).rejects.toThrow("RLS");
  });
});

describe("fetchMyInterests", () => {
  it("lista os interesses do doador logado com a necessidade junto", async () => {
    withSession();
    const row = {
      ...interest,
      need: {
        id: "need-1",
        title: "Cestas básicas",
        status: "open",
        ong: { id: "ong-1", trade_name: "Casa Esperança" },
      },
    };
    const builder = createQueryBuilder({ data: [row] });
    fromMock.mockReturnValue(builder as never);

    await expect(fetchMyInterests()).resolves.toEqual([row]);

    expect(fromMock).toHaveBeenCalledWith("interests");
    expect(builder.select).toHaveBeenCalledWith(
      expect.stringContaining("need:needs("),
    );
    expect(builder.eq).toHaveBeenCalledWith("donor_id", "donor-1");
    expect(builder.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it("devolve lista vazia sem sessão, sem consultar o banco", async () => {
    withoutSession();

    await expect(fetchMyInterests()).resolves.toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("propaga erro do supabase", async () => {
    withSession();
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("RLS") }) as never,
    );

    await expect(fetchMyInterests()).rejects.toThrow("RLS");
  });
});

describe("fetchNeedInterests", () => {
  it("lista os interesses da necessidade, dos mais novos para os mais velhos", async () => {
    const builder = createQueryBuilder({ data: [interest] });
    fromMock.mockReturnValue(builder as never);

    await expect(fetchNeedInterests("need-1")).resolves.toEqual([interest]);

    expect(builder.eq).toHaveBeenCalledWith("need_id", "need-1");
    expect(builder.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it("devolve lista vazia quando a RLS não deixa ver nada", async () => {
    fromMock.mockReturnValue(createQueryBuilder({ data: null }) as never);

    await expect(fetchNeedInterests("need-1")).resolves.toEqual([]);
  });

  it("propaga erro do supabase", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("rede") }) as never,
    );

    await expect(fetchNeedInterests("need-1")).rejects.toThrow("rede");
  });
});

describe("createInterest", () => {
  it("grava o interesse do doador logado", async () => {
    withSession();
    const builder = createQueryBuilder();
    fromMock.mockReturnValue(builder as never);

    await createInterest("need-1", values);

    expect(builder.insert).toHaveBeenCalledWith({
      need_id: "need-1",
      donor_id: "donor-1",
      message: values.message,
      expected_quantity: 10,
      expected_deadline: "2026-12-20",
      share_contact: true,
    });
  });

  it("manda null quando mensagem, quantidade e prazo ficam em branco", async () => {
    withSession();
    const builder = createQueryBuilder();
    fromMock.mockReturnValue(builder as never);

    await createInterest("need-1", {
      message: "   ",
      expected_quantity: "",
      expected_deadline: "",
      share_contact: false,
    });

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        message: null,
        expected_quantity: null,
        expected_deadline: null,
      }),
    );
  });

  it("explica quando não há sessão", async () => {
    withoutSession();

    await expect(createInterest("need-1", values)).rejects.toThrow(
      /Entre na sua conta/,
    );
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("propaga recusa da RLS", async () => {
    withSession();
    const error = { code: "42501", message: "recusado" };
    fromMock.mockReturnValue(createQueryBuilder({ error }) as never);

    await expect(createInterest("need-1", values)).rejects.toEqual(error);
  });
});

describe("deleteInterest", () => {
  it("apaga pelo id", async () => {
    const builder = createQueryBuilder();
    fromMock.mockReturnValue(builder as never);

    await deleteInterest("interest-1");

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "interest-1");
  });

  it("propaga erro do supabase", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("rede") }) as never,
    );

    await expect(deleteInterest("interest-1")).rejects.toThrow("rede");
  });
});

describe("interestErrorMessage", () => {
  it("explica a recusa da RLS para quem não é doador", () => {
    expect(interestErrorMessage({ code: "42501" })).toMatch(/conta de doador/);
  });

  it("usa o fallback nos outros casos", () => {
    expect(interestErrorMessage(new Error("rede"), "falhou")).toBe("falhou");
  });
});

describe("setInterestAnswered", () => {
  it("marca pela função do banco", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never);

    await setInterestAnswered("interest-1", true);

    expect(supabase.rpc).toHaveBeenCalledWith("set_interest_answered", {
      p_interest_id: "interest-1",
      p_answered: true,
    });
  });

  it("propaga a recusa da função", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: "42501" },
    } as never);

    await expect(setInterestAnswered("interest-1", false)).rejects.toEqual({
      code: "42501",
    });
  });
});
