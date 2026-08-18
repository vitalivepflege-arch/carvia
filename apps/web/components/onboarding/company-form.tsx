"use client";

import { useActionState } from "react";
import { onboardingAction, type FormState } from "../../app/actions";
import { SubmitButton } from "../auth/submit-button";

const initialState: FormState = {};

export function CompanyForm() {
  const [state, formAction] = useActionState(onboardingAction, initialState);

  return (
    <form action={formAction} className="rounded-[32px] border border-[var(--border)] bg-[rgba(255,255,255,0.9)] p-8 shadow-2xl shadow-slate-950/5">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Company Setup</p>
      <h2 className="mt-3 text-3xl font-semibold text-[var(--navy)]">Unternehmen einrichten</h2>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        Dieser Schritt verbindet dein Benutzerkonto mit dem ersten Tenant und aktiviert Suche und Inserate.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium">Unternehmensname</span>
          <input name="companyName" required className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Telefon</span>
          <input name="contactPhone" required className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Ziel-Standzeit in Tagen</span>
          <input name="targetDaysToSell" type="number" min={1} defaultValue={35} required className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium">Bevorzugte Marken</span>
          <input name="preferredBrands" defaultValue="BMW, Mercedes-Benz, Audi" required className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium">Mindestmarge in EUR</span>
          <input name="minimumMarginTarget" type="number" min={0} defaultValue={3500} required className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
      </div>

      {state.error ? <p className="mt-4 text-sm text-[var(--danger)]">{state.error}</p> : null}

      <div className="mt-6">
        <SubmitButton label="Tenant aktivieren" pendingLabel="Unternehmen wird angelegt..." />
      </div>
    </form>
  );
}
