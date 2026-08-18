import type { PropsWithChildren } from "react";

export function AuthShell({
  children,
  eyebrow,
  title,
  description
}: PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
}>) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(11,122,117,0.16),transparent_22%),linear-gradient(180deg,#11253b_0%,#0b1524_100%)] px-6 py-10 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.9fr]">
        <section className="flex flex-col justify-between rounded-[36px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.36em] text-teal-200">{eyebrow}</p>
            <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-tight">{title}</h1>
            <p className="mt-5 max-w-lg text-base text-slate-300">{description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["V1 Fokus", "Die erste Version bleibt auf Suche und Inserieren reduziert."],
              ["Auth.js", "Credentials-based access with secure password hashing."],
              ["Onboarding", "Account und Unternehmensprofil werden direkt nacheinander eingerichtet."]
            ].map(([heading, copy]) => (
              <div key={heading} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{heading}</p>
                <p className="mt-2 text-sm text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center">{children}</section>
      </div>
    </main>
  );
}
