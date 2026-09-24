import { Link } from "react-router-dom";
import { HandHeart, MapPin, Megaphone } from "lucide-react";
import { Button } from "@/components/ui";
import { PRIVACY_POLICY_PATH } from "@/features/legal";
import logo from "@/assets/logo.png";

const HIGHLIGHTS = [
  {
    icon: Megaphone,
    title: "A ONG divulga o que precisa",
    description:
      "Instituições verificadas publicam necessidades reais, com quantidade, urgência e prazo.",
  },
  {
    icon: MapPin,
    title: "Você filtra por perto",
    description:
      "Busque por categoria, urgência e localização para achar quem precisa perto de você.",
  },
  {
    icon: HandHeart,
    title: "A doação sai do papel",
    description:
      "Manifeste interesse, combine a entrega e acompanhe as instituições que você segue.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12 py-8">
      <section className="flex flex-col items-center gap-6 text-center">
        <img src={logo} alt="Elovoz" className="h-32 w-auto" />

        <h1 className="max-w-2xl text-2xl font-medium sm:text-3xl">
          Conectamos quem quer doar a quem precisa agora
        </h1>

        <p className="max-w-xl text-muted-foreground">
          O Elovoz dá voz às instituições sociais: elas contam o que está
          faltando hoje, e você encontra a necessidade que consegue atender.
        </p>

        <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link to="/cadastrar">Começar agora</Link>
          </Button>

          <Button asChild size="lg" variant="outline">
            <Link to="/login">Já tenho conta</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5"
            >
              <span className="w-fit rounded-full bg-primary/10 p-3">
                <Icon className="size-5 text-primary" />
              </span>

              <h2 className="font-medium">{item.title}</h2>

              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-lg bg-secondary p-6 text-center text-secondary-foreground">
        <h2 className="text-lg font-medium">Sua instituição também pode</h2>

        <p className="mx-auto mt-2 max-w-xl text-sm opacity-90">
          Cadastre a ONG, passe pela verificação da nossa equipe e comece a
          divulgar necessidades para toda a rede de doadores.
        </p>

        <Button asChild variant="outline" className="mt-4 bg-surface">
          <Link to="/cadastrar">Cadastrar ONG</Link>
        </Button>
      </section>

      <footer className="text-center text-sm text-muted-foreground">
        <Link
          to={PRIVACY_POLICY_PATH}
          className="underline underline-offset-4 hover:text-foreground"
        >
          Política de privacidade
        </Link>
      </footer>
    </div>
  );
}
