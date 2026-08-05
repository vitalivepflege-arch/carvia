"use client";

import { useMemo, useState } from "react";

export function DealCheckForm({
  action,
  taxonomy
}: {
  action: (formData: FormData) => Promise<void>;
  taxonomy: Record<string, string[]>;
}) {
  const makes = useMemo(() => Object.keys(taxonomy), [taxonomy]);
  const [selectedMake, setSelectedMake] = useState(makes[0] ?? "");
  const models = taxonomy[selectedMake] ?? [];

  return (
    <form action={action} className="grid gap-6 rounded-[32px] border border-[var(--border)] bg-[rgba(255,255,255,0.92)] p-8 shadow-2xl shadow-slate-950/5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Deal Check</p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--navy)]">Fahrzeug eingeben und Marktbild simulieren</h2>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Dieser Schritt arbeitet mit klar markierter Mock-Marktdatenbasis und speichert jede Analyse direkt im Tenant-Kontext.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Marke</span>
          <select
            name="make"
            value={selectedMake}
            onChange={(event) => setSelectedMake(event.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Modell</span>
          <select name="model" className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Variante</span>
          <input
            name="variant"
            defaultValue="M340i xDrive"
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Erstzulassung</span>
          <input
            name="firstRegistration"
            type="month"
            defaultValue="2023-03"
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Kilometer</span>
          <input
            name="mileageKm"
            type="number"
            defaultValue={38000}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Leistung (PS)</span>
          <input
            name="powerHp"
            type="number"
            defaultValue={374}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Kraftstoff</span>
          <select
            name="fuelType"
            defaultValue="Petrol"
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            {["Petrol", "Diesel", "Hybrid", "Electric"].map((fuelType) => (
              <option key={fuelType} value={fuelType}>
                {fuelType}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Getriebe</span>
          <select
            name="transmission"
            defaultValue="Automatic"
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            {["Automatic", "Manual"].map((transmission) => (
              <option key={transmission} value={transmission}>
                {transmission}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Einkaufspreis (EUR)</span>
          <input
            name="purchasePrice"
            type="number"
            defaultValue={42000}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Transport</span>
          <input
            name="transportCost"
            type="number"
            defaultValue={250}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Aufbereitung</span>
          <input
            name="preparationCost"
            type="number"
            defaultValue={400}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Reparaturreserve</span>
          <input
            name="repairCost"
            type="number"
            defaultValue={200}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Auktionsgebuehr</span>
          <input
            name="auctionFee"
            type="number"
            defaultValue={0}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Sonstige Kosten</span>
          <input
            name="otherCost"
            type="number"
            defaultValue={0}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>
      </div>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
      >
        Analyse starten
      </button>
    </form>
  );
}
