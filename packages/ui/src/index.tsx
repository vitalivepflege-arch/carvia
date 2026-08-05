import type { HTMLAttributes, PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  title: string;
}>;

type StatusTone = "info" | "success" | "warning" | "danger";

const toneStyles: Record<StatusTone, string> = {
  info: "bg-[rgba(17,37,59,0.08)] text-[var(--navy)]",
  success: "bg-[rgba(31,140,84,0.14)] text-[var(--positive)]",
  warning: "bg-[rgba(202,123,25,0.14)] text-[var(--warning)]",
  danger: "bg-[rgba(190,63,51,0.14)] text-[var(--danger)]"
};

export function Card({ children, title }: CardProps) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.88)] p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--foreground-muted)]">{title}</p>
      {children}
    </section>
  );
}

export function StatusPill({
  children,
  tone = "info",
  ...rest
}: PropsWithChildren<{ tone?: StatusTone } & HTMLAttributes<HTMLSpanElement>>) {
  return (
    <span
      {...rest}
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${toneStyles[tone]} ${
        rest.className ?? ""
      }`.trim()}
    >
      {children}
    </span>
  );
}

