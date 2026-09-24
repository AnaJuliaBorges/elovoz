import { useState } from "react";
import { Search } from "lucide-react";
import { Button, Input, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useProfile } from "@/features/auth";
import { UserCard } from "../components/UserCard";
import { useAdminUsers } from "../hooks/useAdminUsers";
import {
  USER_FILTERS,
  canDeleteUser,
  countByFilter,
  filterUsers,
  type UserFilter,
} from "../model/user";

/**
 * `/admin/usuarios`: todas as contas, com busca e filtro por papel. A lista
 * vem inteira (são poucas contas) e busca e filtro rodam no client.
 */
export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");

  const { data: profile } = useProfile();
  const { data: users, isLoading, isError, refetch } = useAdminUsers();

  const counts = users ? countByFilter(users) : null;
  const visible = users ? filterUsers(users, { search, filter }) : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Todas as contas do Elovoz. Cadastro incompleto é quem criou o login
          mas parou antes de salvar o perfil.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Buscar por nome, e-mail ou ONG"
            placeholder="Buscar por nome, e-mail ou ONG"
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div
          role="group"
          aria-label="Filtrar por tipo de conta"
          className="flex flex-wrap gap-2"
        >
          {USER_FILTERS.map((option) => {
            const active = filter === option.value;

            return (
              <Button
                key={option.value}
                variant={active ? "secondary" : "outline"}
                size="sm"
                className={cn("text-sm", !active && "border-border")}
                aria-pressed={active}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
                {counts && ` (${counts[option.value]})`}
              </Button>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-2 rounded-md bg-destructive-light p-4 text-sm text-destructive"
        >
          Não foi possível carregar os usuários.
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {users && visible.length === 0 && (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhuma conta encontrada.
        </p>
      )}

      {visible.length > 0 && (
        <ul className="flex flex-col gap-3">
          {visible.map((user) => (
            <li key={user.id}>
              <UserCard
                user={user}
                canDelete={canDeleteUser(user, profile?.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
