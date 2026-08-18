import Image from "next/image";
import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { getMarketplaceTaxonomy, searchMarketplaceVehicles } from "@carvia/providers";
import { requireOnboardedSession } from "../../lib/auth";

function readSearchValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function buildSearchHref(
  nextValues: Record<string, string | number | undefined>,
  currentValues: Record<string, string>
) {
  const params = new URLSearchParams();
  const merged = {
    ...currentValues,
    ...Object.fromEntries(
      Object.entries(nextValues).map(([key, value]) => [key, value === undefined ? "" : String(value)])
    )
  };

  for (const [key, value] of Object.entries(merged)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/market-search?${query}` : "/market-search";
}

const registrationOptions = ["", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017"];
const mileageOptions = ["", "20000", "40000", "60000", "80000", "100000", "125000", "150000"];
const priceOptions = ["", "20000", "30000", "40000", "50000", "60000", "80000"];
const fuelOptions = ["", "Petrol", "Diesel", "Hybrid", "Electric"];
const transmissionOptions = ["", "Automatic", "Manual"];

export default async function MarketSearchPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOnboardedSession();
  const params = await searchParams;

  const query = readSearchValue(params.query);
  const make = readSearchValue(params.make);
  const model = readSearchValue(params.model);
  const firstRegistrationFrom = readSearchValue(params.firstRegistrationFrom);
  const mileageKmMax = readSearchValue(params.mileageKmMax);
  const fuelType = readSearchValue(params.fuelType);
  const transmission = readSearchValue(params.transmission);
  const purchasePriceMax = readSearchValue(params.purchasePriceMax);
  const postalCode = readSearchValue(params.postalCode);
  const page = Math.max(1, Number(readSearchValue(params.page) || "1"));

  const activeSearchValues = {
    firstRegistrationFrom,
    fuelType,
    make,
    mileageKmMax,
    model,
    page: String(page),
    postalCode,
    purchasePriceMax,
    query,
    transmission
  };

  const [searchPage, taxonomy] = await Promise.all([
    searchMarketplaceVehicles({
      firstRegistrationFrom: firstRegistrationFrom || undefined,
      fuelType: fuelType || undefined,
      make: make || undefined,
      mileageKmMax: mileageKmMax ? Number(mileageKmMax) : undefined,
      model: model || undefined,
      page,
      pageSize: 20,
      postalCode: postalCode || undefined,
      purchasePriceMax: purchasePriceMax ? Number(purchasePriceMax) : undefined,
      query: query || undefined,
      radiusKm: 50,
      transmission: transmission || undefined
    }),
    getMarketplaceTaxonomy()
  ]);

  const makes = Object.keys(taxonomy).sort((left, right) => left.localeCompare(right));
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("de-DE", {
      currency: "EUR",
      maximumFractionDigits: 0,
      style: "currency"
    }).format(value);

  const paginationSummary =
    searchPage.totalItems > 0
      ? `${((searchPage.currentPage - 1) * searchPage.pageSize) + 1}-${Math.min(
          searchPage.currentPage * searchPage.pageSize,
          searchPage.totalItems
        )} von ${searchPage.totalItems.toLocaleString("de-DE")}`
      : "0 Treffer";

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-4 md:px-8 md:py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[28px] border border-[var(--border)] bg-[rgba(27,24,34,0.92)] px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/assets/mobile-de/logo-dark-de.webp"
                alt="Carvia"
                width={214}
                height={40}
                className="h-9 w-auto"
              />
              <span className="hidden text-sm text-[var(--foreground-muted)] md:block">
                Normale Fahrzeugsuche fuer Autos
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--foreground-muted)] hover:bg-white/5 hover:text-white"
              >
                Start
              </Link>
              <Link
                href="/market-search"
                className="rounded-full bg-[var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-white"
              >
                Fahrzeuge suchen
              </Link>
              <Link
                href="/sell"
                className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--foreground-muted)] hover:bg-white/5 hover:text-white"
              >
                Fahrzeug inserieren
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface)]">
            <Image
              src="/assets/mobile-de/redesign-banner.png"
              alt="Carvia vehicle search banner"
              width={1400}
              height={420}
              className="h-auto w-full"
              priority
            />
          </div>

          <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Normale Version zuerst</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-white">
              Fahrzeuge suchen wie auf einem Marktplatz.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
              Carvia startet jetzt mit der normalen Autosuche. Die Haendlerseite kommt erst danach, wenn die
              Suchstrecke stabil und gut benutzbar laeuft.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <StatusPill tone={searchPage.liveMode ? "success" : "warning"}>
                {searchPage.liveMode ? "Live APIs aktiv" : "Mock fallback aktiv"}
              </StatusPill>
              <StatusPill tone="info">{searchPage.activeProviders.join(", ").toUpperCase()}</StatusPill>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
            <h2 className="text-center text-3xl font-extrabold tracking-[-0.04em] text-white">
              Millionen Fahrzeuge. Eine simple Suche.
            </h2>

            <form className="mt-5 space-y-5">
              <input type="hidden" name="page" value="1" />

              <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[rgba(20,18,24,0.65)] p-3 md:flex-row md:items-center">
                <input
                  name="query"
                  defaultValue={query}
                  placeholder="BMW 3er, Golf GTI, elektrischer SUV"
                  className="min-w-0 flex-1 rounded-[18px] border border-transparent bg-transparent px-4 py-3 text-base font-semibold text-white outline-none"
                />
                <button
                  type="submit"
                  className="rounded-[16px] bg-[var(--accent)] px-6 py-3 text-sm font-extrabold uppercase tracking-[0.14em] text-white"
                >
                  Suchen
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[88px_minmax(0,1fr)]">
                <div className="grid grid-cols-4 overflow-hidden rounded-[22px] border border-[var(--border)] xl:grid-cols-1">
                  {["Autos", "EV", "Sport", "SUV"].map((tab, index) => (
                    <div
                      key={tab}
                      className={`flex min-h-16 items-center justify-center border-[var(--border)] text-sm font-bold ${
                        index === 0
                          ? "bg-[rgba(255,90,0,0.08)] text-[var(--accent)]"
                          : "bg-[var(--surface-elevated)] text-[var(--foreground-muted)]"
                      } ${index < 3 ? "border-r xl:border-b xl:border-r-0" : ""}`}
                    >
                      {tab}
                    </div>
                  ))}
                </div>

                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-white">Marke</span>
                      <select
                        name="make"
                        defaultValue={make}
                        className="w-full rounded-[16px] border border-[var(--border)] bg-[rgba(20,18,24,0.65)] px-4 py-3 text-white outline-none"
                      >
                        <option value="">Beliebig</option>
                        {makes.map((entry) => (
                          <option key={entry} value={entry}>
                            {entry}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-white">Modell</span>
                      <input
                        name="model"
                        defaultValue={model}
                        placeholder="3 Series, C-Class, Golf"
                        className="w-full rounded-[16px] border border-[var(--border)] bg-[rgba(20,18,24,0.65)] px-4 py-3 text-white outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-white">Erstzulassung ab</span>
                      <select
                        name="firstRegistrationFrom"
                        defaultValue={firstRegistrationFrom}
                        className="w-full rounded-[16px] border border-[var(--border)] bg-[rgba(20,18,24,0.65)] px-4 py-3 text-white outline-none"
                      >
                        {registrationOptions.map((entry) => (
                          <option key={entry || "all"} value={entry}>
                            {entry || "Beliebig"}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-white">Kilometer bis</span>
                      <select
                        name="mileageKmMax"
                        defaultValue={mileageKmMax}
                        className="w-full rounded-[16px] border border-[var(--border)] bg-[rgba(20,18,24,0.65)] px-4 py-3 text-white outline-none"
                      >
                        {mileageOptions.map((entry) => (
                          <option key={entry || "all"} value={entry}>
                            {entry ? `${Number(entry).toLocaleString("de-DE")} km` : "Beliebig"}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-white">Preis bis</span>
                      <select
                        name="purchasePriceMax"
                        defaultValue={purchasePriceMax}
                        className="w-full rounded-[16px] border border-[var(--border)] bg-[rgba(20,18,24,0.65)] px-4 py-3 text-white outline-none"
                      >
                        {priceOptions.map((entry) => (
                          <option key={entry || "all"} value={entry}>
                            {entry ? formatCurrency(Number(entry)) : "Beliebig"}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-white">Ort oder PLZ</span>
                      <input
                        name="postalCode"
                        defaultValue={postalCode}
                        placeholder="50667"
                        className="w-full rounded-[16px] border border-[var(--border)] bg-[rgba(20,18,24,0.65)] px-4 py-3 text-white outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-white">Kraftstoff</span>
                      <select
                        name="fuelType"
                        defaultValue={fuelType}
                        className="w-full rounded-[16px] border border-[var(--border)] bg-[rgba(20,18,24,0.65)] px-4 py-3 text-white outline-none"
                      >
                        {fuelOptions.map((entry) => (
                          <option key={entry || "all"} value={entry}>
                            {entry || "Beliebig"}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-white">Getriebe</span>
                      <select
                        name="transmission"
                        defaultValue={transmission}
                        className="w-full rounded-[16px] border border-[var(--border)] bg-[rgba(20,18,24,0.65)] px-4 py-3 text-white outline-none"
                      >
                        {transmissionOptions.map((entry) => (
                          <option key={entry || "all"} value={entry}>
                            {entry || "Beliebig"}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-5 flex flex-col gap-4 border-t border-white/8 pt-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-[var(--foreground-muted)]">
                      {searchPage.liveMode
                        ? "Live provider search is active where official credentials exist."
                        : "Official API credentials are missing, so Carvia is using local demo inventory."}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href="/market-search"
                        className="text-sm font-semibold text-[var(--foreground-muted)]"
                      >
                        Zuruecksetzen
                      </Link>
                      <button
                        type="submit"
                        className="rounded-[16px] bg-[var(--accent)] px-6 py-3 text-sm font-extrabold text-white"
                      >
                        {searchPage.totalItems.toLocaleString("de-DE")} Angebote
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </section>

        {searchPage.warnings.length > 0 ? (
          <Card title="Search Notes">
            <div className="mt-5 space-y-2 text-sm text-[var(--foreground-muted)]">
              {searchPage.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          </Card>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {searchPage.providerStates.map((provider) => (
            <Card key={provider.providerKey} title={provider.displayName}>
              <div className="mt-4 space-y-3">
                <StatusPill
                  tone={
                    provider.status === "configured"
                      ? "success"
                      : provider.status === "mock"
                        ? "warning"
                        : provider.status === "error"
                          ? "danger"
                          : "info"
                  }
                >
                  {provider.status}
                </StatusPill>
                <p className="text-sm text-[var(--foreground-muted)]">{provider.message}</p>
              </div>
            </Card>
          ))}
        </section>

        <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Trefferliste</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-white">
                {paginationSummary}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={buildSearchHref({ page: Math.max(1, searchPage.currentPage - 1) }, activeSearchValues)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                  searchPage.currentPage > 1
                    ? "border-[var(--border)] bg-[var(--surface-elevated)] text-white"
                    : "pointer-events-none border-[var(--border)] bg-[rgba(255,255,255,0.03)] text-[var(--foreground-muted)]"
                }`}
              >
                Zurueck
              </Link>
              <span className="text-sm text-[var(--foreground-muted)]">
                Seite {searchPage.currentPage} / {searchPage.totalPages}
              </span>
              <Link
                href={buildSearchHref({ page: searchPage.currentPage + 1 }, activeSearchValues)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                  searchPage.currentPage < searchPage.totalPages
                    ? "border-[var(--border)] bg-[var(--surface-elevated)] text-white"
                    : "pointer-events-none border-[var(--border)] bg-[rgba(255,255,255,0.03)] text-[var(--foreground-muted)]"
                }`}
              >
                Weiter
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            {searchPage.vehicles.length === 0 ? (
              <Card title="Keine passenden Fahrzeuge">
                <p className="mt-5 text-sm text-[var(--foreground-muted)]">
                  Kein Fahrzeug passt zu den aktiven Filtern. Oeffne die Suche etwas weiter oder hinterlege die
                  offiziellen API-Zugaenge spaeter fuer Live-Daten.
                </p>
              </Card>
            ) : (
              searchPage.vehicles.map((vehicle) => (
                <Card key={vehicle.id} title={`${vehicle.make} ${vehicle.variant ?? vehicle.model}`}>
                  <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-4">
                      <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface-elevated)]">
                        <img
                          src={vehicle.images[0] || "/assets/mobile-de/family-car.webp"}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          className="h-56 w-full object-cover"
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <StatusPill tone={vehicle.provider === "mock" ? "warning" : "success"}>
                          {vehicle.provider}
                        </StatusPill>
                        <StatusPill tone="info">
                          {vehicle.priceGross ? formatCurrency(vehicle.priceGross) : "Preis auf Anfrage"}
                        </StatusPill>
                      </div>

                      <div>
                        <h3 className="text-2xl font-extrabold tracking-[-0.03em] text-white">
                          {vehicle.make} {vehicle.variant ?? vehicle.model}
                        </h3>
                        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                          {(vehicle.bodyType ?? "Auto").toString()} | {(vehicle.trim ?? vehicle.model).toString()} |{" "}
                          {(vehicle.postalCode ?? "DE").toString()}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          ["Erstzulassung", vehicle.firstRegistration ?? "-"],
                          ["Kilometer", vehicle.mileageKm ? `${vehicle.mileageKm.toLocaleString("de-DE")} km` : "-"],
                          ["Kraftstoff", vehicle.fuelType ?? "-"],
                          ["Getriebe", vehicle.transmission ?? "-"]
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-3xl bg-[var(--surface-elevated)] p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</p>
                            <p className="mt-2 text-base font-medium text-white">{value}</p>
                          </div>
                        ))}
                      </div>

                      <p className="text-sm text-[var(--foreground-muted)]">
                        {(vehicle.powerHp ? `${vehicle.powerHp} PS` : "-").toString()} |{" "}
                        {(vehicle.country ?? "DE").toString()} |{" "}
                        {(vehicle.listingUrl ? "Externe Detailseite verfuegbar" : "Lokale Vorschau").toString()}
                      </p>

                      {vehicle.listingUrl ? (
                        <a
                          href={vehicle.listingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Angebot oeffnen
                        </a>
                      ) : null}
                    </div>

                    <div className="rounded-3xl bg-[var(--surface-elevated)] p-4">
                      <p className="text-sm font-medium text-white">Fahrzeug gefunden</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        In v1 ist die Suche rein lesend. Fuer eigene Inserate nutze die separate Inserat-Seite.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href="/sell"
                          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Eigenes Fahrzeug inserieren
                        </Link>
                        {vehicle.listingUrl ? (
                          <a
                            href={vehicle.listingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-semibold text-white"
                          >
                            Extern ansehen
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
