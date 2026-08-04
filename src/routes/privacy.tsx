import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { STUDIO } from "@/lib/format";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy e cookie policy — Studio Evergreen" },
      {
        name: "description",
        content:
          "Come lo Studio Dentistico Evergreen tratta i dati personali e sanitari dei pazienti e quali cookie utilizza il sito.",
      },
      { property: "og:title", content: "Privacy policy — Studio Evergreen" },
      { property: "og:description", content: "Trattamento dei dati e cookie policy." },
      { property: "og:url", content: "/privacy" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Documenti"
        title="Privacy e cookie policy"
        description="Informativa ai sensi degli artt. 13-14 del Regolamento UE 2016/679 (GDPR)."
      />
      <div className="mx-auto max-w-3xl space-y-8 px-5 py-16 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold">Titolare del trattamento</h2>
          <p className="text-muted-foreground mt-2">
            {STUDIO.name}, {STUDIO.address}. Email: {STUDIO.email} — Telefono: {STUDIO.phone}.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Dati trattati e finalità</h2>
          <p className="text-muted-foreground mt-2">
            Trattiamo dati anagrafici e di contatto per la gestione degli appuntamenti, e dati
            relativi alla salute (categoria particolare, art. 9 GDPR) esclusivamente per finalità di
            diagnosi e cura. I messaggi inviati dal modulo contatti sono utilizzati solo per
            rispondere alla richiesta.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Conservazione</h2>
          <p className="text-muted-foreground mt-2">
            La documentazione sanitaria è conservata per il tempo previsto dalla normativa vigente;
            i dati di contatto per un massimo di 24 mesi dall'ultimo contatto.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Diritti dell'interessato</h2>
          <p className="text-muted-foreground mt-2">
            Puoi chiedere in ogni momento accesso, rettifica, cancellazione, limitazione e
            portabilità dei tuoi dati scrivendo a {STUDIO.email}, oppure proporre reclamo al Garante
            per la protezione dei dati personali.
          </p>
        </section>
        <section id="cookie">
          <h2 className="text-xl font-semibold">Cookie</h2>
          <p className="text-muted-foreground mt-2">
            Questo sito utilizza esclusivamente cookie tecnici necessari al funzionamento
            dell'autenticazione e dell'area personale. Non utilizziamo cookie di profilazione né
            strumenti di tracciamento pubblicitario, quindi non è richiesto alcun consenso
            preventivo.
          </p>
        </section>
      </div>
    </SiteLayout>
  );
}