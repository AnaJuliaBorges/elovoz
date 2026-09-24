import {
  Button,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { OngReviewCard } from "../components/OngReviewCard";
import { useOngsForReview } from "../hooks/useOngReview";
import { VERIFICATION_TABS, groupByStatus } from "../model/review";

/**
 * Painel do administrador: verificação das ONGs (RF08). A fila vem inteira
 * numa consulta só e é separada por status aqui — são poucas ONGs, e assim
 * as abas já mostram as contagens.
 */
export default function AdminOngsPage() {
  const { data: ongs, isLoading, isError, refetch } = useOngsForReview();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">Verificação de instituições</h1>
        <p className="text-sm text-muted-foreground">
          Confira CNPJ, responsável, contatos e redes antes de aprovar. Só ONG
          aprovada aparece para os doadores e publica necessidades.
        </p>
      </header>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-2 rounded-md bg-destructive-light p-4 text-sm text-destructive"
        >
          Não foi possível carregar as instituições.
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {ongs && <ReviewTabs groups={groupByStatus(ongs)} />}
    </div>
  );
}

function ReviewTabs({ groups }: { groups: ReturnType<typeof groupByStatus> }) {
  return (
    <Tabs defaultValue="pending" className="gap-4">
      <TabsList className="w-full sm:w-fit">
        {VERIFICATION_TABS.map((tab) => (
          <TabsTrigger key={tab.status} value={tab.status} className="px-3">
            {tab.label} ({groups[tab.status].length})
          </TabsTrigger>
        ))}
      </TabsList>

      {VERIFICATION_TABS.map((tab) => (
        <TabsContent key={tab.status} value={tab.status}>
          {groups[tab.status].length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              {tab.empty}
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {groups[tab.status].map((ong) => (
                <li key={ong.id}>
                  <OngReviewCard ong={ong} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
