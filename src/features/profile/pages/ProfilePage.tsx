import { Link } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  Clock,
  ExternalLink,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { useLogout, useProfile, type UserType } from "@/features/auth";
import { PRIVACY_POLICY_PATH } from "@/features/legal";
import { useMyOng } from "@/features/ongs";
import { DeleteAccountSection } from "../components/DeleteAccountSection";
import { ProfileForm } from "../components/ProfileForm";
import { useAccountEmail } from "../hooks/useAccount";

const ROLE_LABELS: Record<UserType, string> = {
  donor: "Conta de doador",
  ong: "Conta de instituição",
  admin: "Conta de administrador",
};

const PRIVACY_NOTES: Record<UserType, string> = {
  donor:
    "Guardamos só o necessário: nome, e-mail e telefone. Seu nome e seu telefone não aparecem para as instituições. Elas só veem a mensagem que você escreve quando manifesta interesse.",
  ong: "Seu nome, e-mail e telefone pessoais ficam só com o Elovoz. No perfil público aparecem apenas os dados da instituição: endereço, contatos, redes e horários.",
  admin:
    "Você enxerga os dados de todas as contas para verificar instituições. Use só para isso.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-surface p-4">
      <h2 className="font-medium">{title}</h2>
      {children}
    </section>
  );
}

function OngLink({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-3 rounded-md p-3 transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="rounded-full bg-primary/10 p-2">
          <Icon className="size-4 text-primary" aria-hidden="true" />
        </span>
        <span className="flex flex-1 flex-col">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

/**
 * Tudo que a ONG edita sobre a instituição mora aqui (o painel fica só com as
 * necessidades); cada item leva à tela de edição.
 */
function OngSection() {
  const { data: ong, isLoading } = useMyOng();

  if (isLoading) return <Skeleton className="h-28 w-full" />;
  if (!ong) return null;

  return (
    <Section title="Sua instituição">
      <p className="flex items-center gap-2 text-sm">
        <Building2
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        {ong.trade_name}
      </p>

      <ul className="-mx-3 flex flex-col">
        <OngLink
          to="/painel/dados"
          icon={Building2}
          title="Dados da instituição"
          description="Nome, missão, endereço, telefones e redes"
        />
        <OngLink
          to="/painel/horarios"
          icon={Clock}
          title="Horários de funcionamento"
          description="Quando o doador pode procurar vocês"
        />
        {ong.verification_status === "approved" && (
          <OngLink
            to={`/ongs/${ong.id}`}
            icon={ExternalLink}
            title="Ver perfil público"
            description="Como os doadores veem a instituição"
          />
        )}
      </ul>
    </Section>
  );
}

export default function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const { data: email, isLoading: loadingEmail } = useAccountEmail();
  const logout = useLogout();

  if (isLoading || loadingEmail) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div
        role="alert"
        className="mx-auto flex w-full max-w-lg flex-col items-start gap-2 rounded-md bg-destructive-light p-4 text-sm text-destructive"
      >
        Não foi possível carregar seu perfil.
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          {ROLE_LABELS[profile.user_type]}
        </p>
      </header>

      <Section title="Seus dados">
        <ProfileForm profile={profile} email={email ?? null} />
      </Section>

      {profile.user_type === "ong" && <OngSection />}

      <Section title="Privacidade">
        <p className="text-sm text-muted-foreground">
          {PRIVACY_NOTES[profile.user_type]}{" "}
          <Link
            to={PRIVACY_POLICY_PATH}
            className="text-secondary underline underline-offset-4"
          >
            Ler a política de privacidade
          </Link>
        </p>

        <DeleteAccountSection userType={profile.user_type} />
      </Section>

      {/* no celular o menu não tem "Sair": a saída fica aqui */}
      <Button variant="outline" className="self-start" onClick={logout}>
        <LogOut aria-hidden="true" />
        Sair da conta
      </Button>
    </div>
  );
}
