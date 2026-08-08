"use server";

import { revalidatePath } from "next/cache";
import { requireOnboardedSession } from "../../lib/auth";
import { runAutomationRules } from "../../lib/automation";

export async function runAutomationMaintenance() {
  const session = await requireOnboardedSession();
  await runAutomationRules(session.user.companyId!);

  revalidatePath("/");
  revalidatePath("/alerts");
  revalidatePath("/automation-ops");
  revalidatePath("/inventory");
  revalidatePath("/management");
  revalidatePath("/pipeline");
  revalidatePath("/retail");
  revalidatePath("/sales");
  revalidatePath("/watchlist");
}
