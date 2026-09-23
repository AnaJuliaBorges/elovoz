export const ongKeys = {
  all: ["ongs"] as const,
  profile: (id: string) => ["ongs", "profile", id] as const,
  following: (id: string) => ["ongs", "following", id] as const,
};
