import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { getTeamWorkspace, userRoleLabels } from "../../lib/team";
import { createTeamMember, updateTeamMemberRole } from "./actions";

export default async function TeamPage() {
  const session = await requireOnboardedSession();
  const workspace = await getTeamWorkspace(session.user.companyId!);
  const canManageTeam = session.user.role === "OWNER" || session.user.role === "ADMIN";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f3eb_0%,#e7ece7_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Team</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Tenant people and ownership</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Manage who works inside Carvia, which operational lane they own, and how the current follow-up load is distributed across the company.
            </p>
          </div>
          <StatusPill tone={canManageTeam ? "success" : "warning"}>
            {canManageTeam ? "Management access active" : "Read-only access"}
          </StatusPill>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Team", value: String(workspace.overview.teamCount), delta: "Users linked to this tenant" },
            { label: "Buyer", value: String(workspace.overview.buyerCount), delta: "Acquisition operators" },
            { label: "Sales", value: String(workspace.overview.salesCount), delta: "Lead execution operators" },
            { label: "Admin", value: String(workspace.overview.adminCount), delta: "Owner and admin coverage" },
            { label: "Open Tasks", value: String(workspace.overview.openTaskCount), delta: "Current company-wide work queue" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card title="Team Directory">
            <div className="mt-5 space-y-4">
              {workspace.teamMembers.map((member) => (
                <div key={member.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-[var(--navy)]">{member.name ?? member.email}</p>
                        <StatusPill tone={member.role === "VIEWER" ? "info" : member.role === "BUYER" ? "warning" : member.role === "SALES" ? "success" : "danger"}>
                          {userRoleLabels[member.role]}
                        </StatusPill>
                        {member.id === session.user.id ? <StatusPill tone="info">You</StatusPill> : null}
                      </div>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{member.email}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                        Joined {member.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })} |{" "}
                        {member.onboardingCompletedAt ? "Tenant active" : "Onboarding pending"}
                      </p>
                    </div>

                    <div className="min-w-[240px] space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">Open</p>
                          <p className="mt-2 text-lg font-semibold text-[var(--navy)]">{member.workload.open}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">Overdue</p>
                          <p className="mt-2 text-lg font-semibold text-[var(--navy)]">{member.workload.overdue}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">Automation</p>
                          <p className="mt-2 text-lg font-semibold text-[var(--navy)]">{member.workload.automation}</p>
                        </div>
                      </div>

                      {canManageTeam ? (
                        <form action={updateTeamMemberRole} className="flex flex-wrap gap-3">
                          <input type="hidden" name="userId" value={member.id} />
                          <select
                            name="role"
                            defaultValue={member.role}
                            className="flex-1 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          >
                            {Object.entries(userRoleLabels).map(([role, label]) => (
                              <option key={role} value={role}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                          >
                            Save role
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card title="Create Team Member">
              <div className="mt-5 space-y-4">
                <p className="text-sm text-[var(--foreground-muted)]">
                  Create another Carvia login inside this tenant and route new automation or manual work directly to that teammate.
                </p>
                {canManageTeam ? (
                  <form action={createTeamMember} className="grid gap-4">
                    <input
                      name="name"
                      required
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                      placeholder="Leonie Becker"
                    />
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                      placeholder="leonie@carvia.local"
                    />
                    <select
                      name="role"
                      defaultValue="BUYER"
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                    >
                      {Object.entries(userRoleLabels).map(([role, label]) => (
                        <option key={role} value={role}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      name="password"
                      type="password"
                      minLength={8}
                      required
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                      placeholder="Temporary password"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Create teammate
                    </button>
                  </form>
                ) : (
                  <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                    <p className="font-medium text-[var(--navy)]">Role changes need Owner or Admin access</p>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                      You can review workload and assignments here, but only tenant managers can add or reassign teammates.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Role Coverage">
              <div className="mt-5 space-y-4">
                {Object.entries(userRoleLabels).map(([role, label]) => (
                  <div key={role} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-[var(--navy)]">{label}</p>
                      <StatusPill tone="info">
                        {workspace.roleSummary[role as keyof typeof workspace.roleSummary]}
                      </StatusPill>
                    </div>
                  </div>
                ))}
                <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Open automation-assigned tasks across the tenant:{" "}
                    <span className="font-semibold text-[var(--navy)]">{workspace.overview.automationAssignedCount}</span>
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
