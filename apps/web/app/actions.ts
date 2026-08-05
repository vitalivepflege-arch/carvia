"use server";

import { prisma } from "@carvia/database";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "../auth";
import { z } from "zod";

export type FormState = {
  error?: string;
};

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const onboardingSchema = z.object({
  companyName: z.string().trim().min(2),
  contactPhone: z.string().trim().min(5),
  preferredBrands: z.string().trim().min(2),
  minimumMarginTarget: z.coerce.number().nonnegative(),
  targetDaysToSell: z.coerce.number().int().positive()
});

export async function registerAction(
  _previousState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: "Bitte pruefe deine Eingaben." };
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return { error: "Zu dieser E-Mail existiert bereits ein Konto." };
  }

  await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash: await hash(parsed.data.password, 12),
      role: "OWNER"
    }
  });

  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: "/onboarding"
  });

  return {};
}

export async function loginAction(
  _previousState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: "Bitte pruefe deine Anmeldedaten." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/"
    });
  } catch {
    return { error: "Anmeldung fehlgeschlagen." };
  }

  return {};
}

export async function onboardingAction(
  _previousState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = onboardingSchema.safeParse({
    companyName: formData.get("companyName"),
    contactPhone: formData.get("contactPhone"),
    preferredBrands: formData.get("preferredBrands"),
    minimumMarginTarget: formData.get("minimumMarginTarget"),
    targetDaysToSell: formData.get("targetDaysToSell")
  });

  if (!parsed.success) {
    return { error: "Bitte fuelle alle Onboarding-Felder korrekt aus." };
  }

  const company = await prisma.company.create({
    data: {
      name: parsed.data.companyName,
      contactEmail: session.user.email ?? null,
      contactPhone: parsed.data.contactPhone,
      preferredBrands: parsed.data.preferredBrands
        .split(",")
        .map((brand) => brand.trim())
        .filter(Boolean),
      minimumMarginTarget: parsed.data.minimumMarginTarget,
      targetDaysToSell: parsed.data.targetDaysToSell
    }
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      companyId: company.id,
      onboardingCompletedAt: new Date()
    }
  });

  revalidatePath("/");
  redirect("/login");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

