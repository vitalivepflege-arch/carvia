import { SearchPageClient } from "@/app/search/search-page-client";
import { parseSearchFilters } from "@/lib/carvia-market";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialFilters = parseSearchFilters(params);

  return <SearchPageClient key={JSON.stringify(params)} initialFilters={initialFilters} />;
}
