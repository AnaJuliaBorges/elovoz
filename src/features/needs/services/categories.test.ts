import { supabase } from "@/lib/supabase";
import { createQueryBuilder } from "@/test/supabaseQueryBuilder";
import { fetchCategories } from "./categories";

vi.mock("@/lib/supabase", () => ({ supabase: { from: vi.fn() } }));

const fromMock = vi.mocked(supabase.from);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchCategories", () => {
  it("ordena por nome e deixa “Outros” por último", async () => {
    const builder = createQueryBuilder({
      data: [
        { id: "1", name: "Alimentos", icon: null },
        { id: "2", name: "Outros", icon: null },
        { id: "3", name: "Produtos de Limpeza", icon: null },
      ],
    });
    fromMock.mockReturnValue(builder as never);

    const categories = await fetchCategories();

    expect(fromMock).toHaveBeenCalledWith("categories");
    expect(builder.order).toHaveBeenCalledWith("name");
    expect(categories.map((category) => category.name)).toEqual([
      "Alimentos",
      "Produtos de Limpeza",
      "Outros",
    ]);
  });

  it("devolve lista vazia sem dados", async () => {
    fromMock.mockReturnValue(createQueryBuilder({ data: null }) as never);

    await expect(fetchCategories()).resolves.toEqual([]);
  });

  it("propaga erro do supabase", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("sem conexão") }) as never,
    );

    await expect(fetchCategories()).rejects.toThrow("sem conexão");
  });
});
