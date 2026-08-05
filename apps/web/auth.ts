import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@carvia/database";
import { compare } from "bcryptjs";
import { z } from "zod";

type AppRole = "OWNER" | "ADMIN" | "BUYER" | "SALES" | "VIEWER";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" }
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() }
        });

        if (!user) {
          return null;
        }

        const isValid = await compare(parsed.data.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          onboardingCompleted: Boolean(user.onboardingCompletedAt && user.companyId)
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.companyId = user.companyId ?? null;
        token.onboardingCompleted = user.onboardingCompleted ?? false;
      }

      if (!user && token.userId) {
        const freshUser = await prisma.user.findUnique({
          where: { id: String(token.userId) }
        });

        if (freshUser) {
          token.role = freshUser.role;
          token.companyId = freshUser.companyId ?? null;
          token.onboardingCompleted = Boolean(
            freshUser.onboardingCompletedAt && freshUser.companyId
          );
        }
      }

      if (trigger === "update" && session?.user) {
        token.companyId = session.user.companyId ?? null;
        token.role = session.user.role;
        token.onboardingCompleted = session.user.onboardingCompleted;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? token.sub ?? "");
        session.user.role = (token.role as AppRole | undefined) ?? "VIEWER";
        session.user.companyId = (token.companyId as string | null | undefined) ?? null;
        session.user.onboardingCompleted = Boolean(token.onboardingCompleted);
      }

      return session;
    }
  }
});
