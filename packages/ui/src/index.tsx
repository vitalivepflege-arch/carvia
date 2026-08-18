import type { HTMLAttributes, PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  title: string;
}>;

type StatusTone = "info" | "success" | "warning" | "danger";

const toneStyles: Record<StatusTone, string> = {
  info: "bg-[rgba(255,255,255,0.08)] text-[var(--foreground)]",
  success: "bg-[rgba(102,211,156,0.14)] text-[var(--positive)]",
  warning: "bg-[rgba(255,181,74,0.14)] text-[var(--warning)]",
  danger: "bg-[rgba(255,127,111,0.16)] text-[var(--danger)]"
};

export function Card({ children, title }: CardProps) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
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

export function MetricBar({
  label,
  tone = "info",
  value
}: {
  label: string;
  tone?: StatusTone;
  value: number;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        <StatusPill tone={tone}>{clamped}/100</StatusPill>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
        <div
          className={`h-full rounded-full ${
            tone === "success"
              ? "bg-[var(--positive)]"
              : tone === "warning"
                ? "bg-[var(--warning)]"
                : tone === "danger"
                  ? "bg-[var(--danger)]"
                  : "bg-[var(--accent)]"
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function MarketRangeChart({
  current,
  label = "Current position",
  maximum,
  median,
  minimum,
  percentile25,
  percentile75
}: {
  current: number;
  label?: string;
  maximum: number | null;
  median: number | null;
  minimum: number | null;
  percentile25: number | null;
  percentile75: number | null;
}) {
  const fallbackMin = minimum ?? current;
  const fallbackMax = maximum ?? current;
  const rangeMin = Math.min(fallbackMin, current);
  const rangeMax = Math.max(fallbackMax, current);
  const span = Math.max(1, rangeMax - rangeMin);
  const toPercent = (value: number | null) =>
    value === null ? null : Math.max(0, Math.min(100, ((value - rangeMin) / span) * 100));

  const currentPos = toPercent(current) ?? 50;
  const minPos = toPercent(minimum) ?? 0;
  const p25Pos = toPercent(percentile25) ?? 25;
  const medianPos = toPercent(median) ?? 50;
  const p75Pos = toPercent(percentile75) ?? 75;
  const maxPos = toPercent(maximum) ?? 100;

  return (
    <div className="space-y-3">
      <div className="relative h-20 rounded-[24px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-5">
        <div className="relative h-4 rounded-full bg-[rgba(255,255,255,0.08)]">
          <div
            className="absolute top-0 h-4 rounded-full bg-[rgba(102,211,156,0.18)]"
            style={{
              left: `${p25Pos}%`,
              width: `${Math.max(4, p75Pos - p25Pos)}%`
            }}
          />
          <div
            className="absolute top-1/2 h-8 w-0.5 -translate-y-1/2 bg-[var(--foreground)]"
            style={{ left: `${medianPos}%` }}
          />
          <div
            className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--surface)] bg-[var(--accent)] shadow-lg shadow-black/30"
            style={{ left: `${currentPos}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
          <span>Min {minimum !== null ? minimum.toLocaleString("en-US") : "-"}</span>
          <span>Median {median !== null ? median.toLocaleString("en-US") : "-"}</span>
          <span>Max {maximum !== null ? maximum.toLocaleString("en-US") : "-"}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm text-[var(--foreground-muted)]">
        <span>{label}</span>
        <span>EUR {current.toLocaleString("de-DE")}</span>
      </div>
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
        <span>P25 {percentile25 !== null ? percentile25.toLocaleString("en-US") : "-"}</span>
        <span>P75 {percentile75 !== null ? percentile75.toLocaleString("en-US") : "-"}</span>
      </div>
      <div className="hidden">
        {minPos}
        {maxPos}
      </div>
    </div>
  );
}
