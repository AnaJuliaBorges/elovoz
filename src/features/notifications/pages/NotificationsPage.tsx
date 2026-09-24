import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dates";
import { UrgencyBadge } from "@/features/needs";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/useNotifications";
import type { AppNotification } from "../model/notification";

function NotificationItem({
  notification,
  onOpen,
}: {
  notification: AppNotification;
  onOpen: (notification: AppNotification) => void;
}) {
  const { need } = notification;
  const unread = !notification.read;

  const body = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {unread && (
            <span
              className="size-2 rounded-full bg-primary"
              aria-label="Não lido"
            />
          )}
          {formatDate(notification.created_at)}
        </span>
        {need && <UrgencyBadge urgency={need.urgency} />}
      </div>

      <p className="text-sm">
        {need ? (
          <>
            <span className="font-medium">
              {need.ong?.trade_name ?? "Uma instituição que você segue"}
            </span>{" "}
            publicou uma necessidade:{" "}
            <span className="font-medium">{need.title}</span>
          </>
        ) : (
          <span className="text-muted-foreground">
            Esta necessidade não está mais disponível.
          </span>
        )}
      </p>
    </>
  );

  const className = cn(
    "flex flex-col gap-2 rounded-lg border bg-surface p-4",
    unread && "border-primary/40",
  );

  if (!need) return <div className={className}>{body}</div>;

  return (
    <Link
      to={`/necessidades/${need.id}`}
      onClick={() => onOpen(notification)}
      className={cn(
        className,
        "transition-colors outline-none hover:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-ring/50",
      )}
    >
      {body}
    </Link>
  );
}

/** Avisos de novas necessidades das ONGs que o doador segue (RF09). */
export default function NotificationsPage() {
  const { data: notifications, isLoading, isError, refetch } =
    useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const hasUnread = notifications?.some((notification) => !notification.read);

  function handleOpen(notification: AppNotification) {
    if (!notification.read) markRead.mutate(notification.id);
  }

  function handleMarkAll() {
    markAllRead.mutate(undefined, {
      onError: () =>
        toast.error("Não foi possível marcar os avisos como lidos."),
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium">Avisos</h1>

        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            disabled={markAllRead.isPending}
            onClick={handleMarkAll}
          >
            <CheckCheck aria-hidden="true" />
            Marcar todos como lidos
          </Button>
        )}
      </header>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-2 rounded-md bg-destructive-light p-4 text-sm text-destructive"
        >
          Não foi possível carregar seus avisos.
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {notifications && notifications.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
          <span className="rounded-full bg-muted p-3">
            <Bell className="size-6 text-muted-foreground" aria-hidden="true" />
          </span>
          <p className="font-medium">Nenhum aviso por aqui</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Siga uma instituição pelo perfil dela e avisamos quando ela publicar
            uma necessidade nova.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/necessidades">Buscar necessidades</Link>
          </Button>
        </div>
      )}

      {notifications && notifications.length > 0 && (
        <ul className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <NotificationItem
                notification={notification}
                onOpen={handleOpen}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
