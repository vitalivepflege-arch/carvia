import { prisma } from "@carvia/database";

export const userRoleLabels = {
  ADMIN: "Admin",
  BUYER: "Buyer",
  OWNER: "Owner",
  SALES: "Sales",
  VIEWER: "Viewer"
} as const;

export async function getCompanyTeamRoster(companyId: string) {
  return prisma.user.findMany({
    where: { companyId },
    orderBy: [{ role: "asc" }, { name: "asc" }, { email: "asc" }],
    select: {
      email: true,
      id: true,
      name: true,
      role: true
    }
  });
}

export function buildAssigneeLabel(input: {
  assigneeName: string | null;
  assigneeRole: keyof typeof userRoleLabels | null;
  assigneeUser: { email: string; name: string | null; role: keyof typeof userRoleLabels } | null;
}) {
  if (input.assigneeUser) {
    return `${input.assigneeUser.name ?? input.assigneeUser.email} (${userRoleLabels[input.assigneeUser.role]})`;
  }

  if (input.assigneeName && input.assigneeRole) {
    return `${input.assigneeName} (${userRoleLabels[input.assigneeRole]})`;
  }

  if (input.assigneeRole) {
    return userRoleLabels[input.assigneeRole];
  }

  return input.assigneeName ?? "Unassigned";
}
