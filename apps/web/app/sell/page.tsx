import Link from "next/link";
import { Card } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { createSellVehicle } from "./actions";

const fuelOptions = ["Petrol", "Diesel", "Hybrid", "Electric"];
const transmissionOptions = ["Automatic", "Manual"];
const bodyTypeOptions = ["Sedan", "Wagon", "SUV", "Hatchback", "Coupe", "Convertible"];

export default async function SellPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireOnboardedSession();
  const params = searchParams ? await searchParams : undefined;
  const created = typeof params?.created === "string" && params.created === "1";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#0d1829_0%,#15283f_100%)] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="text-xl font-black tracking-[-0.05em]">
              Carvia
            </Link>
            <nav className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Start
              </Link>
              <Link
                href="/market-search"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Fahrzeuge suchen
              </Link>
              <Link
                href="/sell"
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              >
                Fahrzeug inserieren
              </Link>
            </nav>
          </div>
        </header>

        {created ? (
          <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
            Fahrzeug wurde als lokales Inserat gespeichert.
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-white/10 bg-[rgba(255,255,255,0.05)] p-6 text-white backdrop-blur">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">Fahrzeug inserieren</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em]">
              Fahrzeugdaten erfassen und direkt als Inserat anlegen.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Diese erste Version erfasst nur das Inserat selbst. Keine nachgelagerten Verkaufsboards, keine
              CRM-Strecken, keine Management-Sichten.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Company", session.user.companyId ? "Aktiv verbunden" : "Offen"],
                ["Modus", "Reines Inserieren"],
                ["Status", "Lokale Erfassung aktiv"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
                  <p className="mt-2 text-base font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <Card title="Verkaufsroute">
            <div className="mt-5 space-y-4 text-sm text-[var(--foreground)]">
              <div className="rounded-3xl bg-[var(--surface-muted)] p-4">
                <p className="font-medium text-[var(--navy)]">1. Fahrzeug erfassen</p>
                <p className="mt-2 text-[var(--foreground-muted)]">
                  Stammdaten, Kilometerstand, Antrieb und Preis sauber hinterlegen.
                </p>
              </div>
              <div className="rounded-3xl bg-[var(--surface-muted)] p-4">
                <p className="font-medium text-[var(--navy)]">2. Inserat lokal speichern</p>
                <p className="mt-2 text-[var(--foreground-muted)]">
                  Das Fahrzeug wird als lokales Inserat angelegt und bleibt fuer die erste Version einfach.
                </p>
              </div>
              <div className="rounded-3xl bg-[var(--surface-muted)] p-4">
                <p className="font-medium text-[var(--navy)]">3. Danach weiter pflegen</p>
                <p className="mt-2 text-[var(--foreground-muted)]">
                  Spaeter koennen weitere Verkaufsfunktionen folgen. In v1 bleibt der Scope bewusst klein.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <Card title="Fahrzeug zum Verkauf anlegen">
          <form action={createSellVehicle} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Marke</span>
              <input
                name="make"
                placeholder="BMW"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Modell</span>
              <input
                name="model"
                placeholder="3 Series"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Variante</span>
              <input
                name="variant"
                placeholder="320d Touring"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Erstzulassung</span>
              <input
                name="firstRegistration"
                placeholder="2022-06"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Kilometer</span>
              <input
                name="mileageKm"
                type="number"
                min={0}
                placeholder="42000"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Leistung (PS)</span>
              <input
                name="powerHp"
                type="number"
                min={40}
                placeholder="245"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Preis</span>
              <input
                name="priceGross"
                type="number"
                min={1}
                placeholder="32990"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--navy)]">PLZ</span>
              <input
                name="postalCode"
                placeholder="50667"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Farbe</span>
              <input
                name="exteriorColor"
                placeholder="Schwarz"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Karosserie</span>
              <select
                name="bodyType"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                {bodyTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Kraftstoff</span>
              <select
                name="fuelType"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                {fuelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Getriebe</span>
              <select
                name="transmission"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                {transmissionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-2 xl:col-span-3">
              <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Notiz</span>
              <textarea
                name="note"
                rows={4}
                placeholder="Beispiel: frischer Service, sofort verfuegbar, guter Zustand, neue Bremsen."
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <div className="md:col-span-2 xl:col-span-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
              <p className="text-sm text-[var(--foreground-muted)]">
                Das Fahrzeug wird direkt lokal als Inserat in Carvia gespeichert.
              </p>
              <button
                type="submit"
                className="rounded-full bg-[var(--navy)] px-6 py-3 text-sm font-semibold text-white"
              >
                Fahrzeug inserieren
              </button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
