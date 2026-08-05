import { redirect } from "next/navigation";
import { auth } from "../auth";

export async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireOnboardedSession() {
  const session = await requireSession();

  if (!session.user.onboardingCompleted || !session.user.companyId) {
    redirect("/onboarding");
  }

  return session;
}

