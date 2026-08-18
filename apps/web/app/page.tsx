import Link from "next/link";
import { requireOnboardedSession } from "../lib/auth";

export default async function HomePage() {
  await requireOnboardedSession();

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[32px] border border-[var(--border)] bg-[rgba(27,24,34,0.92)] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--foreground-muted)]">Carvia v1</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-white md:text-5xl">
            Reine Fahrzeugsuche.
            <br />
            Reines Fahrzeug inserieren.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--foreground-muted)] md:text-base">
            Diese erste Version von Carvia macht nur zwei Dinge: Fahrzeuge suchen und Fahrzeuge inserieren.
            Alles andere ist aus dem Einstieg entfernt.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/market-search"
              className="rounded-[18px] bg-[var(--accent)] px-6 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-white"
            >
              Fahrzeuge suchen
            </Link>
            <Link
              href="/sell"
              className="rounded-[18px] border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white"
            >
              Fahrzeug inserieren
            </Link>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <article className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Suche</p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-white">
              Fahrzeuge nach Marke, Modell, Preis und Laufleistung filtern.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
              Die Suche ist auf normale Fahrzeugabfragen reduziert. Fokus liegt auf schnellem Finden statt auf
              internen Workflows.
            </p>
          </article>

          <article className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Inserieren</p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-white">
              Fahrzeuge manuell anlegen und direkt als Inserat erfassen.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
              Die Eingabemaske erfasst die relevanten Fahrzeugdaten ohne nachgelagerte CRM-, Sales- oder
              Management-Funktionen.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
