import "next-auth";
import "next-auth/jwt";

type AppRole = "OWNER" | "ADMIN" | "BUYER" | "SALES" | "VIEWER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: AppRole;
      companyId: null | string;
      onboardingCompleted: boolean;
    };
  }

  interface User {
    role: AppRole;
    companyId: null | string;
    onboardingCompleted: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: AppRole;
    companyId?: null | string;
    onboardingCompleted?: boolean;
  }
}

