import { toast } from "sonner";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui";
import { useProfile } from "@/features/auth";
import { useIsFollowingOng, useToggleFollowOng } from "../hooks/useFollowOng";
import { followErrorMessage } from "../services/ongFollowers";

/**
 * Seguir/deixar de seguir a ONG (RF11). Só aparece para doador: a policy de
 * INSERT em `ong_followers` exige `current_user_type() = 'donor'`, então para
 * ONG e admin o botão só existiria para dar erro.
 */
export function FollowOngButton({ ongId }: { ongId: string }) {
  const { data: profile } = useProfile();
  const isDonor = profile?.user_type === "donor";

  const { data: isFollowing, isLoading } = useIsFollowingOng(ongId, {
    enabled: isDonor,
  });
  const toggle = useToggleFollowOng(ongId);

  if (!isDonor) return null;

  const following = !!isFollowing;

  function handleClick() {
    toggle.mutate(following, {
      onSuccess: () =>
        toast.success(
          following
            ? "Você deixou de seguir esta instituição"
            : "Pronto! Avisaremos quando ela publicar uma necessidade",
        ),
      onError: (error) => toast.error(followErrorMessage(error)),
    });
  }

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="lg"
      className="self-start"
      aria-pressed={following}
      disabled={isLoading || toggle.isPending}
      onClick={handleClick}
    >
      {following ? (
        <BellRing aria-hidden="true" />
      ) : (
        <Bell aria-hidden="true" />
      )}
      {following ? "Seguindo" : "Seguir"}
    </Button>
  );
}
