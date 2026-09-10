import { createAppQueryClient } from "./queryClient";
import { reportError } from "./reportError";

vi.mock("./reportError", () => ({ reportError: vi.fn() }));

const reportErrorMock = vi.mocked(reportError);

beforeEach(() => {
  reportErrorMock.mockReset();
});

describe("createAppQueryClient", () => {
  it("mantém os defaults de cache das queries", () => {
    const { queries } = createAppQueryClient().getDefaultOptions();

    expect(queries).toMatchObject({
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    });
  });

  it("reporta falha de query com a queryKey", async () => {
    const queryClient = createAppQueryClient();
    const error = new Error("falha ao buscar necessidades");

    await expect(
      queryClient.fetchQuery({
        queryKey: ["needs", 1],
        queryFn: () => Promise.reject(error),
        retry: false,
      }),
    ).rejects.toThrow(error);

    expect(reportErrorMock).toHaveBeenCalledWith(error, {
      source: "query",
      detail: '["needs",1]',
    });
  });

  it("reporta falha de mutation sem mutationKey", async () => {
    const queryClient = createAppQueryClient();
    const error = new Error("falha ao salvar");

    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationFn: () => Promise.reject(error),
      retry: false,
    });

    await expect(mutation.execute(undefined)).rejects.toThrow(error);

    expect(reportErrorMock).toHaveBeenCalledWith(error, {
      source: "mutation",
      detail: undefined,
    });
  });

  it("reporta falha de mutation com a mutationKey quando existe", async () => {
    const queryClient = createAppQueryClient();
    const error = new Error("falha no login");

    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationKey: ["login"],
      mutationFn: () => Promise.reject(error),
      retry: false,
    });

    await expect(mutation.execute(undefined)).rejects.toThrow(error);

    expect(reportErrorMock).toHaveBeenCalledWith(error, {
      source: "mutation",
      detail: '["login"]',
    });
  });
});
