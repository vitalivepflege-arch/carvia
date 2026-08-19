import Image from "next/image";
import Link from "next/link";
import {
  allBrands,
  demoVehicles,
  formatCurrency,
  formatMonthYear,
  formatNumber,
  fuelOptions,
  getBrandLogo,
  topBrands,
} from "@/lib/carvia-market";

export default function Home() {
  const featuredVehicles = demoVehicles.slice(0, 4);

  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <div className="mx-auto max-w-[1480px] px-4 py-6 md:px-8 lg:px-10">
        <header className="mb-6 flex items-center justify-between rounded-[28px] border border-white/8 bg-[var(--surface)] px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <Image
              src="/assets/mobile-de/logo-dark-de.webp"
              alt="Carvia"
              width={180}
              height={34}
              className="h-8 w-auto"
            />
            <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-[var(--foreground-muted)]">
              Search Desktop
            </span>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/search" className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold">
              Zur Suche
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[34px] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(239,74,6,0.26),transparent_28%),linear-gradient(145deg,#1d1b22_0%,#121117_100%)] p-6 md:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Carvia Fahrzeugsuche</p>
            <h1 className="mt-3 text-[44px] font-black leading-[0.95] tracking-[-0.06em] md:text-[72px]">
              Millionen Fahrzeuge.
              <br />
              Eine simple Suche.
            </h1>
            <p className="mt-5 max-w-[640px] text-base leading-7 text-white/74">
              Die Startseite ist jetzt fuer Desktop und Mobile aufgeraeumt. Suche startet hier, die Ergebnisliste liegt
              danach separat auf einer eigenen Seite nur fuer Fahrzeuge.
            </p>

            <form action="/search" className="mt-8 rounded-[30px] border border-white/8 bg-[rgba(17,16,22,0.88)] p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Suche</span>
                  <input name="query" placeholder="Porsche 911, Golf GTI, 50667" className="form-input" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Marke</span>
                  <select name="make" className="form-input">
                    <option value="">Beliebig</option>
                    {allBrands.map((brand) => (
                      <option key={brand.name} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Kraftstoff</span>
                  <select name="fuelType" className="form-input">
                    {fuelOptions.map((option) => (
                      <option key={option || "all"} value={option}>
                        {option || "Beliebig"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Preis bis</span>
                  <input name="maxPrice" placeholder="50000" className="form-input" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Kilometer bis</span>
                  <input name="maxMileage" placeholder="80000" className="form-input" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Ort oder PLZ</span>
                  <input name="postalCode" placeholder="50667" className="form-input" />
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  {topBrands.slice(0, 5).map((brand) => (
                    <Link
                      key={brand}
                      href={`/search?make=${encodeURIComponent(brand)}`}
                      className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/78"
                    >
                      {brand}
                    </Link>
                  ))}
                </div>

                <button type="submit" className="contact-button">
                  Fahrzeuge suchen
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-[34px] border border-white/8 bg-[var(--surface)] p-4 md:p-5">
            <Image
              src="/assets/mobile-de/redesign-banner.png"
              alt="Carvia Search Interface"
              width={1200}
              height={760}
              className="h-[320px] w-full rounded-[26px] object-cover md:h-[420px]"
              priority
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MetricCard label="Marken mit Logo" value={String(allBrands.length)} />
              <MetricCard label="Demo-Fahrzeuge" value={String(demoVehicles.length)} />
              <MetricCard label="Ergebnisseite" value="Live" />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[34px] border border-white/8 bg-[var(--surface)] p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Alle Marken</p>
              <h2 className="text-[34px] font-black tracking-[-0.05em]">Komplette Markenuebersicht mit Logos</h2>
            </div>
            <p className="max-w-[520px] text-sm leading-6 text-white/68">
              Jede Marke fuehrt direkt in die Ergebnisliste. Keine Platzhalter-Chips mehr, sondern echte Marken-Assets.
            </p>
          </div>

          <div className="grid max-h-[760px] grid-cols-2 gap-3 overflow-auto pr-1 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {allBrands.map((brand) => (
              <Link
                key={brand.name}
                href={`/search?make=${encodeURIComponent(brand.name)}`}
                className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-[var(--surface-soft)] px-4 py-3 transition hover:border-white/18"
              >
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full bg-white object-contain p-1.5"
                />
                <span className="truncate text-sm font-semibold">{brand.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Marktbeispiele</p>
              <h2 className="text-[34px] font-black tracking-[-0.05em]">Direkt suchbare Fahrzeuge</h2>
            </div>
            <Link href="/search" className="text-sm font-semibold text-[var(--accent-soft)]">
              Ganze Ergebnisliste oeffnen
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {featuredVehicles.map((vehicle) => (
              <Link
                key={vehicle.id}
                href={`/search?make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}`}
                className="rounded-[30px] border border-white/8 bg-[var(--surface)] p-4 transition hover:border-white/18"
              >
                <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                  <Image
                    src={vehicle.image}
                    alt={`${vehicle.make} ${vehicle.variant}`}
                    width={520}
                    height={340}
                    className="h-[190px] w-full rounded-[22px] object-cover"
                  />

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={getBrandLogo(vehicle.make)}
                        alt={vehicle.make}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-full bg-white object-contain p-2"
                      />
                      <div>
                        <p className="text-[28px] font-black tracking-[-0.04em]">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-[var(--foreground-muted)]">{vehicle.variant}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[30px] font-black tracking-[-0.05em]">{formatCurrency(vehicle.priceGross)}</p>
                      <span className="rounded-full bg-[#1b3c31] px-3 py-1 text-xs font-semibold text-[#8be29b]">
                        {vehicle.priceRating}
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <p className="rounded-[18px] bg-[var(--surface-soft)] px-4 py-3 text-sm">
                        EZ {formatMonthYear(vehicle.firstRegistration)}
                      </p>
                      <p className="rounded-[18px] bg-[var(--surface-soft)] px-4 py-3 text-sm">
                        {formatNumber(vehicle.mileageKm)} km
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-[var(--surface-soft)] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">{label}</p>
      <p className="mt-2 text-[28px] font-black tracking-[-0.04em]">{value}</p>
    </div>
  );
}
