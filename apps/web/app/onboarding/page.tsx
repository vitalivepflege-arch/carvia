import { CompanyForm } from "../../components/onboarding/company-form";
import { requireSession } from "../../lib/auth";

export default async function OnboardingPage() {
  const session = await requireSession();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[36px] bg-[rgba(17,37,59,0.96)] p-8 text-white shadow-2xl shadow-slate-950/15">
          <p className="text-xs uppercase tracking-[0.32em] text-teal-200">Phase 1</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight">Tenant aktivieren und das erste Dealer-Profil vorbereiten.</h1>
          <p className="mt-5 max-w-lg text-base text-slate-300">
            Willkommen{session.user.name ? `, ${session.user.name}` : ""}. Mit diesem Schritt verknuepfst du dein Benutzerkonto mit dem ersten Unternehmen und schaltest Dashboard, Watchlist und spaetere Provider-Syncs frei.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              "Company record wird in PostgreSQL angelegt.",
              "Dein Benutzer wird als Owner diesem Tenant zugeordnet.",
              "Dashboard-Zugriff wird danach nur noch im Company-Kontext erlaubt."
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section>
          <CompanyForm />
        </section>
      </div>
    </main>
  );
}
