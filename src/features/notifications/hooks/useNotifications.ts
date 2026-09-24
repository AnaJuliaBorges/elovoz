import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNewNotifications,
} from "../services/notifications";
import type { AppNotification } from "../model/notification";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

function countUnread(notifications: AppNotification[]): number {
  return notifications.filter((notification) => !notification.read).length;
}

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
  });
}

/** O contador do menu sai da mesma consulta da tela, sem uma ida extra ao banco. */
export function useUnreadNotificationsCount({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    select: countUnread,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["notifications", "read"],
    mutationFn: markNotificationRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["notifications", "read-all"],
    mutationFn: markAllNotificationsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });
}

/**
 * Enquanto o app está aberto, um aviso novo recarrega a lista (e o contador
 * do menu) e aparece como toast. Sem `donorId` não escuta nada.
 */
export function useNotificationsRealtime(donorId: string | undefined) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!donorId) return;

    return subscribeToNewNotifications(donorId, () => {
      void queryClient.invalidateQueries({
        queryKey: NOTIFICATIONS_QUERY_KEY,
      });
      toast("Nova necessidade de uma instituição que você segue", {
        action: { label: "Ver", onClick: () => navigate("/notificacoes") },
      });
    });
  }, [donorId, queryClient, navigate]);
}
