import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, HandHeart, Package } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Skeleton,
} from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { useProfile } from "@/features/auth";
import { useMyInterest } from "../hooks/useInterests";
import {
  useCreateInterest,
  useDeleteInterest,
} from "../hooks/useInterestMutations";
import { interestErrorMessage } from "../services/interests";
import type { InterestFormInput } from "../model/schema";
import { InterestForm } from "./InterestForm";

/**
 * Manifestar interesse numa necessidade (RF06). Só aparece para doador: a
 * policy de INSERT em `interests` exige `current_user_type() = 'donor'`.
 *
 * `accepting` desliga o convite quando a necessidade já foi atendida ou o
 * prazo passou — quem já manifestou continua vendo o que enviou.
 */
export function DonorInterestSection({
  needId,
  accepting,
}: {
  needId: string;
  accepting: boolean;
}) {
  const [formOpen, setFormOpen] = useState(false);

  const { data: profile } = useProfile();
  const isDonor = profile?.user_type === "donor";

  const { data: interest, isLoading } = useMyInterest(needId, {
    enabled: isDonor,
  });
  const createInterest = useCreateInterest(needId);
  const deleteInterest = useDeleteInterest();

  if (!isDonor) return null;

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  async function handleSubmit(values: InterestFormInput) {
    try {
      await createInterest.mutateAsync(values);
      setFormOpen(false);
      toast.success("Interesse enviado para a instituição");
    } catch {
      // a mensagem aparece no form, a partir de `createInterest.error`
    }
  }

  function handleCancelInterest() {
    if (!interest) return;

    deleteInterest.mutate(interest.id, {
      onSuccess: () => toast.success("Interesse cancelado"),
      onError: (error) =>
        toast.error(
          interestErrorMessage(
            error,
            "Não foi possível cancelar seu interesse.",
          ),
        ),
    });
  }

  if (interest) {
    const details = [
      interest.expected_quantity
        ? { icon: Package, text: `Quantidade: ${interest.expected_quantity}` }
        : null,
      interest.expected_deadline
        ? {
            icon: CalendarClock,
            text: `Até ${formatDate(interest.expected_deadline)}`,
          }
        : null,
    ].filter((item) => item !== null);

    return (
      <section
        aria-labelledby="seu-interesse"
        className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-surface p-4"
      >
        <h2 id="seu-interesse" className="flex items-center gap-2 font-medium">
          <HandHeart className="size-5 text-primary" aria-hidden="true" />
          Você manifestou interesse
        </h2>

        {interest.message && (
          <p className="text-sm whitespace-pre-line">{interest.message}</p>
        )}

        {details.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {details.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5">
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              disabled={deleteInterest.isPending}
            >
              Cancelar interesse
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar seu interesse?</AlertDialogTitle>
              <AlertDialogDescription>
                A instituição deixa de ver sua mensagem. Você pode manifestar
                interesse de novo depois.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleCancelInterest}
              >
                Cancelar interesse
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    );
  }

  if (!accepting) return null;

  if (!formOpen) {
    return (
      <Button
        size="lg"
        className="self-start"
        onClick={() => setFormOpen(true)}
      >
        <HandHeart aria-hidden="true" />
        Tenho interesse
      </Button>
    );
  }

  return (
    <section
      aria-labelledby="quero-doar"
      className="flex flex-col gap-3 rounded-lg border bg-surface p-4"
    >
      <h2 id="quero-doar" className="font-medium">
        Quero doar
      </h2>

      <InterestForm
        onSubmit={handleSubmit}
        onCancel={() => setFormOpen(false)}
        submitting={createInterest.isPending}
        error={
          createInterest.error
            ? interestErrorMessage(createInterest.error)
            : null
        }
      />
    </section>
  );
}
