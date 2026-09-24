import { BackButton } from "@/components/shared/BackButton";
import { CONTACT_EMAIL, PRIVACY_POLICY_UPDATED_AT } from "../model/privacy";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}

/**
 * Política de privacidade (RNF03/LGPD). Pública: o visitante precisa ler antes
 * de criar a conta. O texto descreve o que o app faz de fato — ao mudar o que
 * é coletado ou quem vê o quê, atualize aqui e a data em `model/privacy.ts`.
 */
export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-4">
      <header className="flex flex-col gap-3">
        <BackButton className="-ml-2" />
        <h1 className="text-2xl font-medium">Política de privacidade</h1>
        <p className="text-sm text-muted-foreground">
          Atualizada em {PRIVACY_POLICY_UPDATED_AT}
        </p>
        <p className="text-sm leading-relaxed">
          O Elovoz conecta doadores a instituições sociais. Para isso, precisamos
          de alguns dados seus. Aqui explicamos quais, para quê, quem vê cada um
          e como você controla tudo isso, conforme a Lei Geral de Proteção de
          Dados (Lei nº 13.709/2018, a LGPD).
        </p>
      </header>

      <Section title="Quem cuida dos seus dados">
        <p>
          O Elovoz é um projeto de extensão universitária. Dúvidas ou pedidos
          sobre seus dados podem ser enviados para{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-secondary underline underline-offset-4"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="Quais dados coletamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="font-medium">Da sua conta:</strong> nome, e-mail,
            telefone (opcional) e senha. A senha é guardada cifrada pelo serviço
            de autenticação e ninguém da equipe tem acesso a ela.
          </li>
          <li>
            <strong className="font-medium">Da instituição, se você for ONG:</strong>{" "}
            nome fantasia, razão social, CNPJ, missão, endereço, telefones,
            redes sociais, site e horários de funcionamento.
          </li>
          <li>
            <strong className="font-medium">Do seu uso:</strong> os interesses
            que você manifesta (mensagem, quantidade e prazo previstos e, se
            você autorizar, seu contato para aquela instituição), as
            instituições que você segue e os avisos que já leu.
          </li>
        </ul>
        <p>
          Não usamos ferramentas de análise, rastreamento ou publicidade, e não
          vendemos nem repassamos dados a terceiros.
        </p>
      </Section>

      <Section title="Para que usamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Entrar na sua conta e mostrar o que é seu.</li>
          <li>
            Mostrar aos doadores as necessidades e o perfil das instituições.
          </li>
          <li>
            Levar sua mensagem de interesse até a instituição que precisa da
            doação e, quando você autoriza, o seu contato, para ela combinar a
            entrega.
          </li>
          <li>
            Avisar quando uma instituição que você segue publicar uma
            necessidade.
          </li>
          <li>
            Verificar as instituições antes de publicá-las. A equipe confere o
            CNPJ em consultas públicas e os contatos e as redes informados.
          </li>
        </ul>
        <p>
          O tratamento é o necessário para prestar o serviço que você pediu ao
          criar a conta (art. 7º, V, da LGPD). Compartilhar seu contato com uma
          instituição depende do seu consentimento, dado a cada interesse (art.
          7º, I).
        </p>
      </Section>

      <Section title="Quem vê o quê">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="font-medium">Doador:</strong> as instituições
            veem a mensagem, a quantidade e o prazo que você informa ao
            manifestar interesse. Seu nome, e-mail e telefone só aparecem para
            a instituição daquele interesse, e só se você marcar
            &quot;Compartilhar meu nome, e-mail e telefone&quot;. A caixa vem
            desmarcada, vale só para aquele interesse e o contato é apagado se
            você cancelar o interesse.
          </li>
          <li>
            <strong className="font-medium">Instituição:</strong> depois de
            aprovada, os dados da instituição (nome, missão, endereço, telefones,
            redes, site e horários) ficam públicos no perfil dela. O nome, o
            e-mail e o telefone pessoais de quem criou a conta não aparecem.
          </li>
          <li>
            As instituições que você segue e os avisos que recebe são vistos só
            por você.
          </li>
          <li>
            A equipe de administração vê os dados das contas para verificar
            instituições e manter o serviço funcionando.
          </li>
        </ul>
      </Section>

      <Section title="Onde os dados ficam">
        <p>
          Os dados ficam no Supabase, que fornece o banco de dados e a
          autenticação, com acesso restrito por regras que só deixam cada pessoa
          ler o que pode ver. O site é hospedado na Vercel.
        </p>
        <p>
          Seu navegador guarda a sessão de login e, enquanto você preenche o
          cadastro, um rascunho do formulário, sem a senha. Isso não sai do seu
          aparelho.
        </p>
      </Section>

      <Section title="Por quanto tempo">
        <p>
          Guardamos os dados enquanto sua conta existir. Quando você exclui a
          conta, tudo o que é ligado a ela é apagado na hora: perfil,
          instituição, necessidades, interesses, instituições seguidas e avisos.
          Cópias de segurança automáticas do provedor podem manter esses dados
          por um período limitado antes de serem descartadas.
        </p>
      </Section>

      <Section title="Seus direitos">
        <p>A LGPD garante que você pode, a qualquer momento:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            ver e corrigir seu nome e telefone, na página{" "}
            <strong className="font-medium">Perfil</strong>;
          </li>
          <li>
            excluir sua conta e todos os seus dados, também no{" "}
            <strong className="font-medium">Perfil</strong>;
          </li>
          <li>
            pedir uma cópia dos seus dados, tirar dúvidas ou fazer qualquer
            outra solicitação pelo e-mail {CONTACT_EMAIL}.
          </li>
        </ul>
      </Section>

      <Section title="Mudanças nesta política">
        <p>
          Se mudarmos o que coletamos ou como usamos, atualizamos esta página e
          a data no topo.
        </p>
      </Section>
    </article>
  );
}
