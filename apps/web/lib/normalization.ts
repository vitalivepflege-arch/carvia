type NormalizationResult = {
  value: string | null;
  warnings: string[];
};

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeFreeText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export function normalizeMake(value: string | null | undefined): NormalizationResult {
  const normalized = normalizeFreeText(value);

  if (!normalized) {
    return { value: null, warnings: [] };
  }

  const aliases: Record<string, string> = {
    audi: "Audi",
    bmw: "BMW",
    mercedes: "Mercedes-Benz",
    "mercedes benz": "Mercedes-Benz",
    volkswagen: "Volkswagen",
    vw: "Volkswagen"
  };

  const canonical = aliases[normalized.toLowerCase()] ?? toTitleCase(normalized);
  return { value: canonical, warnings: canonical !== normalized ? [`Make normalized from "${normalized}" to "${canonical}".`] : [] };
}

export function normalizeModel(value: string | null | undefined) {
  const normalized = normalizeFreeText(value);
  return normalized ? toTitleCase(normalized) : null;
}

export function normalizeFuelType(value: string | null | undefined): NormalizationResult {
  const normalized = normalizeFreeText(value);

  if (!normalized) {
    return { value: null, warnings: [] };
  }

  const aliases: Record<string, string> = {
    benzine: "Petrol",
    diesel: "Diesel",
    electric: "Electric",
    elektro: "Electric",
    hybrid: "Hybrid",
    petrol: "Petrol"
  };

  const canonical = aliases[normalized.toLowerCase()] ?? toTitleCase(normalized);
  const warnings = canonical !== normalized ? [`Fuel type normalized from "${normalized}" to "${canonical}".`] : [];

  return { value: canonical, warnings };
}

export function normalizeTransmission(value: string | null | undefined): NormalizationResult {
  const normalized = normalizeFreeText(value);

  if (!normalized) {
    return { value: null, warnings: [] };
  }

  const aliases: Record<string, string> = {
    auto: "Automatic",
    automatic: "Automatic",
    automatik: "Automatic",
    manual: "Manual",
    schaltgetriebe: "Manual"
  };

  const canonical = aliases[normalized.toLowerCase()] ?? toTitleCase(normalized);
  const warnings = canonical !== normalized
    ? [`Transmission normalized from "${normalized}" to "${canonical}".`]
    : [];

  return { value: canonical, warnings };
}

export function normalizeFirstRegistration(value: string | null | undefined): NormalizationResult {
  const normalized = normalizeFreeText(value);

  if (!normalized) {
    return { value: null, warnings: [] };
  }

  const match = normalized.match(/^(\d{4})[-/.](\d{1,2})$/);

  if (!match) {
    return {
      value: normalized,
      warnings: [`First registration "${normalized}" is not in YYYY-MM format.`]
    };
  }

  const [, year, monthRaw] = match;
  const month = monthRaw.padStart(2, "0");
  const canonical = `${year}-${month}`;

  return {
    value: canonical,
    warnings: canonical !== normalized ? [`First registration normalized from "${normalized}" to "${canonical}".`] : []
  };
}

export function normalizePostalCode(value: string | null | undefined): NormalizationResult {
  const normalized = normalizeFreeText(value);

  if (!normalized) {
    return { value: null, warnings: [] };
  }

  const digits = normalized.replace(/\s+/g, "");

  return {
    value: digits,
    warnings: /^\d{5}$/.test(digits) ? [] : [`Postal code "${normalized}" does not match the expected 5-digit DE format.`]
  };
}

export function collectVehicleSoftWarnings(input: {
  firstRegistration: string | null;
  mileageKm: number | null;
  powerHp: number | null;
  priceGross: number | null;
}) {
  const warnings: string[] = [];

  if (input.mileageKm !== null && input.mileageKm > 180000) {
    warnings.push(`Mileage ${input.mileageKm} km is unusually high for dealer sourcing.`);
  }

  if (input.powerHp !== null && input.powerHp > 700) {
    warnings.push(`Power ${input.powerHp} PS looks unusually high and should be verified.`);
  }

  if (input.priceGross !== null && input.priceGross < 1000) {
    warnings.push(`Price EUR ${input.priceGross} looks unusually low and may indicate malformed input.`);
  }

  if (input.firstRegistration !== null) {
    const year = Number(input.firstRegistration.slice(0, 4));

    if (Number.isFinite(year) && year < 2005) {
      warnings.push(`First registration ${input.firstRegistration} is relatively old for the current premium sourcing focus.`);
    }
  }

  return warnings;
}
