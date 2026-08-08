"use server";

import { prisma } from "@carvia/database";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";

const createTeamMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(8),
  role: z.enum(["OWNER", "ADMIN", "BUYER", "SALES", "VIEWER"])
});

const updateTeamRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "BUYER", "SALES", "VIEWER"]),
  userId: z.string().min(1)
});

function revalidateTeamSurfaces() {
  revalidatePath("/");
  revalidatePath("/alerts");
  revalidatePath("/automation-ops");
  revalidatePath("/tasks");
  revalidatePath("/team");
  revalidatePath("/watchlist");
}

async function requireTeamManager() {
  const session = await requireOnboardedSession();

  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export async function createTeamMember(formData: FormData) {
  const session = await requireTeamManager();
  const parsed = createTeamMemberSchema.parse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role")
  });

  const email = parsed.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return;
  }

  await prisma.user.create({
    data: {
      companyId: session.user.companyId!,
      email,
      name: parsed.name,
      onboardingCompletedAt: new Date(),
      passwordHash: await hash(parsed.password, 12),
      role: parsed.role
    }
  });

  revalidateTeamSurfaces();
}

export async function updateTeamMemberRole(formData: FormData) {
  const session = await requireTeamManager();
  const parsed = updateTeamRoleSchema.parse({
    role: formData.get("role"),
    userId: formData.get("userId")
  });

  const member = await prisma.user.findFirst({
    where: {
      companyId: session.user.companyId!,
      id: parsed.userId
    },
    select: {
      id: true,
      role: true
    }
  });

  if (!member) {
    return;
  }

  if (member.id === session.user.id && parsed.role === "VIEWER") {
    return;
  }

  await prisma.user.update({
    where: { id: member.id },
    data: {
      role: parsed.role
    }
  });

  revalidateTeamSurfaces();
}
