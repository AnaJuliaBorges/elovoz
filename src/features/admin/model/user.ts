import type { UserType } from "@/features/auth";
import type { VerificationStatus } from "@/features/ongs";

/**
 * Conta como o admin vê (retorno de `admin_list_users`). `user_type` nulo é
 * cadastro incompleto: o login foi criado, mas o perfil nunca foi gravado.
 */
export interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  user_type: UserType | null;
  created_at: string;
  last_sign_in_at: string | null;
  ong_id: string | null;
  ong_trade_name: string | null;
  ong_status: VerificationStatus | null;
}

export type UserFilter = "all" | UserType | "incomplete";

export const USER_FILTERS: { value: UserFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "donor", label: "Doadores" },
  { value: "ong", label: "ONGs" },
  { value: "admin", label: "Admins" },
  { value: "incomplete", label: "Incompletos" },
];

export const USER_TYPE_LABELS: Record<UserType, string> = {
  donor: "Doador",
  ong: "ONG",
  admin: "Admin",
};

export const ONG_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: "em análise",
  approved: "aprovada",
  rejected: "recusada",
};

/** Minúsculas e sem acento: "José" acha "jose" e vice-versa. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function matchesFilter(user: AdminUser, filter: UserFilter): boolean {
  if (filter === "all") return true;
  if (filter === "incomplete") return user.user_type === null;

  return user.user_type === filter;
}

/** Busca por nome, e-mail ou nome da ONG, combinada com o filtro de papel. */
export function filterUsers(
  users: AdminUser[],
  { search, filter }: { search: string; filter: UserFilter },
): AdminUser[] {
  const term = normalize(search);

  return users.filter((user) => {
    if (!matchesFilter(user, filter)) return false;
    if (!term) return true;

    return [user.name, user.email, user.ong_trade_name].some(
      (field) => field && normalize(field).includes(term),
    );
  });
}

export function countByFilter(users: AdminUser[]): Record<UserFilter, number> {
  const counts: Record<UserFilter, number> = {
    all: users.length,
    donor: 0,
    ong: 0,
    admin: 0,
    incomplete: 0,
  };

  for (const user of users) counts[user.user_type ?? "incomplete"] += 1;

  return counts;
}

/**
 * Mesma regra da função `admin_delete_user`: admin não exclui a si mesmo
 * (isso é pelo Perfil) nem outro admin.
 */
export function canDeleteUser(
  user: AdminUser,
  currentUserId: string | undefined,
): boolean {
  return user.user_type !== "admin" && user.id !== currentUserId;
}
