import { prisma } from "@carvia/database";
import { importVehicleRowSchema, type ImportVehicleRow } from "@carvia/domain";
import {
  collectVehicleSoftWarnings,
  normalizeFirstRegistration,
  normalizeFuelType,
  normalizeFreeText,
  normalizeMake,
  normalizeModel,
  normalizePostalCode,
  normalizeTransmission
} from "./normalization";

const expectedHeaders = [
  "providerVehicleId",
  "make",
  "model",
  "variant",
  "firstRegistration",
  "mileageKm",
  "fuelType",
  "transmission",
  "powerHp",
  "priceGross",
  "postalCode",
  "listingUrl"
] as const;

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function readNullableNumber(value: string | undefined) {
  const normalized = normalizeFreeText(value);

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function getImportTemplateCsv() {
  return `${expectedHeaders.join(",")}
ext-001,BMW,3 Series,M340i xDrive,2023-03,38000,Petrol,Automatic,374,48490,80331,https://example.com/listing/1
ext-002,Audi,A5,S5 TDI Quattro,2022-11,47000,Diesel,Automatic,341,51100,20095,https://example.com/listing/2`;
}

export function parseVehicleImportCsv(csv: string) {
  const trimmed = csv.trim();

  if (!trimmed) {
    throw new Error("CSV content is empty.");
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const header = parseCsvLine(lines[0] ?? "");
  const missingHeaders = expectedHeaders.filter((column) => !header.includes(column));

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
  }

  const headerIndex = new Map(header.map((column, index) => [column, index]));

  const rows = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const make = normalizeMake(values[headerIndex.get("make") ?? -1]);
    const firstRegistration = normalizeFirstRegistration(values[headerIndex.get("firstRegistration") ?? -1]);
    const fuelType = normalizeFuelType(values[headerIndex.get("fuelType") ?? -1]);
    const transmission = normalizeTransmission(values[headerIndex.get("transmission") ?? -1]);
    const postalCode = normalizePostalCode(values[headerIndex.get("postalCode") ?? -1]);
    const candidate = {
      firstRegistration: firstRegistration.value,
      fuelType: fuelType.value,
      listingUrl: normalizeFreeText(values[headerIndex.get("listingUrl") ?? -1]),
      make: make.value ?? "",
      mileageKm: readNullableNumber(values[headerIndex.get("mileageKm") ?? -1]),
      model: normalizeModel(values[headerIndex.get("model") ?? -1]) ?? "",
      postalCode: postalCode.value,
      powerHp: readNullableNumber(values[headerIndex.get("powerHp") ?? -1]),
      priceGross: readNullableNumber(values[headerIndex.get("priceGross") ?? -1]),
      providerVehicleId: normalizeFreeText(values[headerIndex.get("providerVehicleId") ?? -1]) ?? "",
      transmission: transmission.value,
      variant: normalizeFreeText(values[headerIndex.get("variant") ?? -1])
    };

    const warnings = [
      ...make.warnings,
      ...firstRegistration.warnings,
      ...fuelType.warnings,
      ...transmission.warnings,
      ...postalCode.warnings,
      ...collectVehicleSoftWarnings({
        firstRegistration: candidate.firstRegistration,
        mileageKm: candidate.mileageKm,
        powerHp: candidate.powerHp,
        priceGross: candidate.priceGross
      })
    ];

    return {
      lineNumber: index + 2,
      parsed: importVehicleRowSchema.safeParse(candidate),
      warnings
    };
  });

  return rows;
}

export async function saveVehicleImportRun(input: {
  companyId: string;
  csv: string;
  fileName?: string | null;
}) {
  const parsedRows = parseVehicleImportCsv(input.csv);
  const warnings: string[] = [];
  let importedCount = 0;

  for (const row of parsedRows) {
    if (!row.parsed.success) {
      warnings.push(`Line ${row.lineNumber}: ${row.parsed.error.issues[0]?.message ?? "Invalid row"}`);
      continue;
    }

    const vehicleRow: ImportVehicleRow = row.parsed.data;
    for (const warning of row.warnings) {
      warnings.push(`Line ${row.lineNumber}: ${warning}`);
    }

    const vehicle = await prisma.vehicle.upsert({
      where: {
        provider_providerVehicleId: {
          provider: "import-csv",
          providerVehicleId: vehicleRow.providerVehicleId
        }
      },
      update: {
        firstRegistration: vehicleRow.firstRegistration
          ? new Date(`${vehicleRow.firstRegistration}-01T00:00:00.000Z`)
          : null,
        fuelType: vehicleRow.fuelType,
        listingUrl: vehicleRow.listingUrl,
        make: vehicleRow.make,
        mileageKm: vehicleRow.mileageKm,
        model: vehicleRow.model,
        postalCode: vehicleRow.postalCode,
        powerHp: vehicleRow.powerHp,
        priceGross: vehicleRow.priceGross,
        transmission: vehicleRow.transmission,
        lastSeenAt: new Date()
      },
      create: {
        provider: "import-csv",
        providerVehicleId: vehicleRow.providerVehicleId,
        make: vehicleRow.make,
        model: vehicleRow.model,
        firstRegistration: vehicleRow.firstRegistration
          ? new Date(`${vehicleRow.firstRegistration}-01T00:00:00.000Z`)
          : null,
        mileageKm: vehicleRow.mileageKm,
        fuelType: vehicleRow.fuelType,
        powerHp: vehicleRow.powerHp,
        transmission: vehicleRow.transmission,
        priceGross: vehicleRow.priceGross,
        country: "DE",
        postalCode: vehicleRow.postalCode,
        listingUrl: vehicleRow.listingUrl,
        firstSeenAt: new Date(),
        lastSeenAt: new Date()
      }
    });

    await prisma.watchlist.upsert({
      where: {
        companyId_vehicleId: {
          companyId: input.companyId,
          vehicleId: vehicle.id
        }
      },
      update: {
        note: `Imported from CSV${vehicleRow.variant ? ` | ${vehicleRow.variant}` : ""}`,
        priority: "MEDIUM",
        stage: "NEW"
      },
      create: {
        companyId: input.companyId,
        note: `Imported from CSV${vehicleRow.variant ? ` | ${vehicleRow.variant}` : ""}`,
        priority: "MEDIUM",
        stage: "NEW",
        vehicleId: vehicle.id
      }
    });

    importedCount += 1;
  }

  const skippedCount = parsedRows.length - importedCount;

  await prisma.importRun.create({
    data: {
      companyId: input.companyId,
      fileName: input.fileName ?? null,
      importedCount,
      rowCount: parsedRows.length,
      skippedCount,
      sourceType: "csv",
      warnings
    }
  });

  return {
    importedCount,
    rowCount: parsedRows.length,
    skippedCount,
    warnings
  };
}

export async function getImportRuns(companyId: string) {
  const runs = await prisma.importRun.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return runs.map((run) => ({
    ...run,
    warnings: Array.isArray(run.warnings) ? run.warnings.filter((item): item is string => typeof item === "string") : []
  }));
}
