import { act, renderHook } from "@testing-library/react";
import { useDebouncedValue } from "./useDebouncedValue";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("só entrega o valor novo depois do atraso", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 400),
      { initialProps: { value: "Cen" } },
    );

    rerender({ value: "Centro" });
    expect(result.current).toBe("Cen");

    act(() => vi.advanceTimersByTime(399));
    expect(result.current).toBe("Cen");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("Centro");
  });

  it("reinicia a contagem a cada mudança", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 400),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "ab" });
    act(() => vi.advanceTimersByTime(300));
    rerender({ value: "abc" });
    act(() => vi.advanceTimersByTime(300));

    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("abc");
  });
});
