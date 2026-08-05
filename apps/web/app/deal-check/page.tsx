import { DealCheckForm } from "../../components/deal-check/deal-check-form";
import { requireOnboardedSession } from "../../lib/auth";
import { getDealCheckTaxonomy } from "../../lib/deal-check";
import { createDealCheck } from "./actions";

export default async function DealCheckPage() {
  await requireOnboardedSession();
  const taxonomy = await getDealCheckTaxonomy();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[36px] bg-[rgba(17,37,59,0.96)] p-8 text-white shadow-2xl shadow-slate-950/15">
            <p className="text-xs uppercase tracking-[0.32em] text-teal-200">Phase 2</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight">Deal Check startet jetzt mit echter Fahrzeugeingabe statt nur Dashboard-Placeholdern.</h1>
            <p className="mt-5 max-w-xl text-base text-slate-300">
              Die Analyse verwendet bewusst markierte Mock-Angebote, damit wir den Datenfluss vom Fahrzeugformular bis zur gespeicherten Deal-Entscheidung lokal pruefen koennen.
            </p>
            <div className="mt-8 grid gap-4">
              {[
                "Marke und Modell werden aus der Mock-Taxonomie abgeleitet.",
                "Gesamteinstand, Marktmedian, Margin und DealerScore werden serverseitig berechnet.",
                "Jede Analyse wird tenant-sicher gespeichert und bekommt eine eigene Detailseite."
              ].map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <DealCheckForm action={createDealCheck} taxonomy={taxonomy} />
        </section>
      </div>
    </main>
  );
}
