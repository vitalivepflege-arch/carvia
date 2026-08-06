"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";
import { saveVehicleImportRun } from "../../lib/imports";

const importSchema = z.object({
  csvContent: z.string().min(1),
  fileName: z.string().optional()
});

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function importVehiclesCsv(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = importSchema.parse({
    csvContent: formData.get("csvContent"),
    fileName: readOptionalString(formData, "fileName")
  });

  const result = await saveVehicleImportRun({
    companyId: session.user.companyId!,
    csv: parsed.csvContent,
    fileName: parsed.fileName
  });

  revalidatePath("/imports");
  revalidatePath("/watchlist");
  revalidatePath("/");

  redirect(
    `/imports?imported=${result.importedCount}&rows=${result.rowCount}&skipped=${result.skippedCount}`
  );
}
