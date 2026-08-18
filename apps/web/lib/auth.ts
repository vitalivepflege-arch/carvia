import { redirect } from "next/navigation";
import { auth } from "../auth";

function getDemoSession() {
  if (process.env.SEED_DEMO_DATA !== "true") {
    return null;
  }

  return {
    user: {
      id: "demo-user-carvia",
      email: "demo@carvia.local",
      name: "Carvia Demo Owner",
      role: "OWNER" as const,
      companyId: "demo-company-carvia",
      onboardingCompleted: true
    }
  };
}

export async function requireSession() {
  try {
    const session = await auth();

    if (!session?.user) {
      const demoSession = getDemoSession();

      if (demoSession) {
        return demoSession;
      }

      redirect("/login");
    }

    return session;
  } catch {
    const demoSession = getDemoSession();

    if (demoSession) {
      return demoSession;
    }

    redirect("/login");
  }
}

export async function requireOnboardedSession() {
  const session = await requireSession();

  if (!session.user.onboardingCompleted || !session.user.companyId) {
    redirect("/onboarding");
  }

  return session;
}
