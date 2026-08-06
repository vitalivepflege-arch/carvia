"use server";

import { prisma } from "@carvia/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";
import { buildAlertDigestPreview, getAlertCenter, getNotificationPreference } from "../../lib/alerts";

const notificationPreferenceSchema = z.object({
  deliveryChannel: z.enum(["IN_APP", "EMAIL_READY"]),
  digestEnabled: z.boolean(),
  recipientEmail: z.string().email().optional().or(z.literal("")),
  sendHourLocal: z.coerce.number().int().min(6).max(22)
});

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function saveNotificationPreference(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = notificationPreferenceSchema.parse({
    deliveryChannel: formData.get("deliveryChannel"),
    digestEnabled: formData.get("digestEnabled") === "on",
    recipientEmail: readOptionalString(formData, "recipientEmail") ?? "",
    sendHourLocal: formData.get("sendHourLocal")
  });

  await prisma.notificationPreference.upsert({
    where: { companyId: session.user.companyId! },
    update: {
      deliveryChannel: parsed.deliveryChannel,
      digestEnabled: parsed.digestEnabled,
      recipientEmail: parsed.recipientEmail || null,
      sendHourLocal: parsed.sendHourLocal
    },
    create: {
      companyId: session.user.companyId!,
      deliveryChannel: parsed.deliveryChannel,
      digestEnabled: parsed.digestEnabled,
      recipientEmail: parsed.recipientEmail || null,
      sendHourLocal: parsed.sendHourLocal
    }
  });

  revalidatePath("/alerts");
}

export async function sendTestDigest() {
  const session = await requireOnboardedSession();
  const companyId = session.user.companyId!;
  const [alertCenter, preference] = await Promise.all([
    getAlertCenter(companyId),
    getNotificationPreference(companyId)
  ]);

  const preview = buildAlertDigestPreview(alertCenter);

  await prisma.notificationDigestRun.create({
    data: {
      actionableCount: alertCenter.summary.actionableCount,
      companyId,
      deliveryChannel: preference.deliveryChannel,
      preview,
      recipientEmail: preference.recipientEmail,
      status: preference.digestEnabled ? "SENT" : "SKIPPED_DISABLED"
    }
  });

  revalidatePath("/alerts");
}
