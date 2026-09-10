export interface ErrorContext {
  source: "query" | "mutation" | "route";
  detail?: string;
}

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

export function reportError(error: unknown, context: ErrorContext): void {
  if (import.meta.env.DEV) {
    const scope = context.detail
      ? `${context.source} ${context.detail}`
      : context.source;

    console.error(`[${scope}] ${toMessage(error)}`, error);
  }
}
