export type UserType = "donor" | "ong" | "admin";

export interface Profile {
  id: string;
  user_type: UserType;
  name: string;
  phone: string | null;
  created_at: string;
}

/** Para onde cada papel vai quando entra na área logada. */
export const HOME_BY_USER_TYPE: Record<UserType, string> = {
  donor: "/necessidades",
  ong: "/painel",
  admin: "/admin",
};

export function homeFor(userType: UserType | undefined): string {
  return userType ? HOME_BY_USER_TYPE[userType] : "/necessidades";
}
