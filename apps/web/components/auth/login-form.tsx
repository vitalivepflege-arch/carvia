"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type FormState } from "../../app/actions";
import { SubmitButton } from "./submit-button";

const initialState: FormState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="w-full max-w-md rounded-[32px] bg-[var(--surface)] p-8 text-[var(--foreground)] shadow-2xl shadow-slate-950/10">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Anmelden</p>
      <h2 className="mt-3 text-3xl font-semibold text-[var(--navy)]">Willkommen zurueck</h2>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        Melde dich an, um dein Haendlerkonto zu oeffnen und deine Carvia-Analysen weiterzufuehren.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">E-Mail</span>
          <input name="email" type="email" required className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none ring-0" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Passwort</span>
          <input name="password" type="password" minLength={8} required className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none ring-0" />
        </label>
      </div>

      {state.error ? <p className="mt-4 text-sm text-[var(--danger)]">{state.error}</p> : null}

      <div className="mt-6">
        <SubmitButton label="Einloggen" pendingLabel="Anmeldung laeuft..." />
      </div>

      <p className="mt-4 text-sm text-[var(--foreground-muted)]">
        Noch kein Konto? <Link href="/register" className="font-medium text-[var(--accent)]">Jetzt registrieren</Link>
      </p>
    </form>
  );
}

