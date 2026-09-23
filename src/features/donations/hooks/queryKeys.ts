export const interestKeys = {
  all: ["interests"] as const,
  mine: (needId: string) => ["interests", "mine", needId] as const,
  forNeed: (needId: string) => ["interests", "need", needId] as const,
};
