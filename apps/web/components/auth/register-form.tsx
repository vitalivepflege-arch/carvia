"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type FormState } from "../../app/actions";
import { SubmitButton } from "./submit-button";

const initialState: FormState = {};

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="w-full max-w-md rounded-[32px] bg-[var(--surface)] p-8 text-[var(--foreground)] shadow-2xl shadow-slate-950/10">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Registrieren</p>
      <h2 className="mt-3 text-3xl font-semibold text-[var(--navy)]">Neues Haendlerkonto</h2>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        Erstelle dein Konto und richte im naechsten Schritt dein Unternehmen fuer Carvia ein.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Name</span>
          <input name="name" required className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none ring-0" />
        </label>
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
        <SubmitButton label="Konto anlegen" pendingLabel="Konto wird erstellt..." />
      </div>

      <p className="mt-4 text-sm text-[var(--foreground-muted)]">
        Bereits registriert? <Link href="/login" className="font-medium text-[var(--accent)]">Zur Anmeldung</Link>
      </p>
    </form>
  );
}

