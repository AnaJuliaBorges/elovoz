export const ongKeys = {
  all: ["ongs"] as const,
  profile: (id: string) => ["ongs", "profile", id] as const,
  following: (id: string) => ["ongs", "following", id] as const,
  followed: ["ongs", "followed"] as const,
  openingHours: (id: string) => ["ongs", "opening-hours", id] as const,
};
