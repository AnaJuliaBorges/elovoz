import { toast } from "sonner";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui";
import { AuthRequiredDialog, useProfile } from "@/features/auth";
import { useIsFollowingOng, useToggleFollowOng } from "../hooks/useFollowOng";
import { followErrorMessage } from "../services/ongFollowers";

/**
 * Seguir/deixar de seguir a ONG (RF11). Só funciona para doador: a policy de
 * INSERT em `ong_followers` exige `current_user_type() = 'donor'`, então para
 * ONG e admin o botão só existiria para dar erro. O visitante sem conta vê o
 * botão, que abre o convite para se cadastrar.
 */
export function FollowOngButton({ ongId }: { ongId: string }) {
  const { data: profile } = useProfile();
  const isDonor = profile?.user_type === "donor";
  // `null` é sem sessão; `undefined` ainda está carregando
  const isVisitor = profile === null;

  const { data: isFollowing, isLoading } = useIsFollowingOng(ongId, {
    enabled: isDonor,
  });
  const toggle = useToggleFollowOng(ongId);

  if (isVisitor) {
    return (
      <AuthRequiredDialog
        title="Crie sua conta para seguir"
        description="Com uma conta de doador, você recebe um aviso sempre que esta instituição publicar uma necessidade."
        trigger={
          <Button size="lg" className="self-start">
            <Bell aria-hidden="true" />
            Seguir
          </Button>
        }
      />
    );
  }

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
