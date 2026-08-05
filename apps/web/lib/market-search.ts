import { prisma } from "@carvia/database";

export type SavedSearchFilters = {
  fuelType: string;
  make: string;
  model: string;
  purchasePriceMax: string;
  transmission: string;
};

function normalizeSavedFilters(value: unknown): SavedSearchFilters {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      fuelType: "",
      make: "",
      model: "",
      purchasePriceMax: "",
      transmission: ""
    };
  }

  const record = value as Record<string, unknown>;

  return {
    fuelType: typeof record.fuelType === "string" ? record.fuelType : "",
    make: typeof record.make === "string" ? record.make : "",
    model: typeof record.model === "string" ? record.model : "",
    purchasePriceMax: typeof record.purchasePriceMax === "string" ? record.purchasePriceMax : "",
    transmission: typeof record.transmission === "string" ? record.transmission : ""
  };
}

export async function getSavedSearches(companyId: string) {
  const searches = await prisma.savedSearch.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" }
  });

  return searches.map((search) => ({
    ...search,
    filters: normalizeSavedFilters(search.filters)
  }));
}
