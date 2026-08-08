import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { getTeamWorkspace, userRoleLabels } from "../../lib/team";
import { watchlistStageLabels } from "../../lib/watchlist";
import {
  applyRebalanceSuggestion,
  bulkAssignRoleQueue,
  createTeamMember,
  updateCapacitySettings,
  updateTaskAssignment,
  updateTeamMemberRole
} from "./actions";

const priorityTone = {
  HIGH: "danger",
  LOW: "info",
  MEDIUM: "warning"
} as const;

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

        <div className="grid gap-4 md:grid-cols-3">
          {workspace.roleCapacity.map((role) => (
            <Card key={role.role} title={`${role.label} Capacity`}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">
                {role.currentLoad}/{role.limit}
              </p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                Overdue {role.overdue} | SLA breach {role.stale}
              </p>
              <div className="mt-4">
                <StatusPill tone={role.health === "critical" ? "danger" : role.health === "warning" ? "warning" : "success"}>
                  {role.health === "critical" ? "Overloaded" : role.health === "warning" ? "At risk" : "Healthy"}
                </StatusPill>
              </div>
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
            <Card title="Assignment Control">
              <div className="mt-5 space-y-4">
                <p className="text-sm text-[var(--foreground-muted)]">
                  Move live workload between queues or named teammates when one lane gets overloaded or a shift changes during the day.
                </p>
                {canManageTeam ? (
                  <>
                    <form action={bulkAssignRoleQueue} className="grid gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                      <p className="text-sm font-medium text-[var(--navy)]">Bulk rebalance a role queue</p>
                      <select
                        name="fromRole"
                        defaultValue="BUYER"
                        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                      >
                        {Object.entries(userRoleLabels).map(([role, label]) => (
                          <option key={role} value={role}>
                            From {label}
                          </option>
                        ))}
                      </select>
                      <select
                        name="toRole"
                        defaultValue="SALES"
                        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                      >
                        {Object.entries(userRoleLabels).map(([role, label]) => (
                          <option key={role} value={role}>
                            To {label}
                          </option>
                        ))}
                      </select>
                      <select
                        name="toUserId"
                        defaultValue=""
                        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                      >
                        <option value="">Move to target role queue only</option>
                        {workspace.teamMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {(member.name ?? member.email)} - {userRoleLabels[member.role]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Rebalance queue
                      </button>
                    </form>

                    <div className="space-y-3">
                      {workspace.taskBoard.length === 0 ? (
                        <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                          <p className="font-medium text-[var(--navy)]">No open tasks to rebalance</p>
                          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                            As soon as Carvia or the team creates follow-up work, it will appear here for reassignment control.
                          </p>
                        </div>
                      ) : (
                        workspace.taskBoard.map((task) => (
                          <div key={task.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-[var(--navy)]">{task.title}</p>
                                  {task.origin === "AUTOMATION" ? <StatusPill tone="info">Automation</StatusPill> : null}
                                  {task.assigneeRole ? <StatusPill tone="warning">{userRoleLabels[task.assigneeRole]}</StatusPill> : null}
                                </div>
                                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                                  {task.vehicle ? `${task.vehicle.make} ${task.vehicle.model}` : "Tracked vehicle"} |{" "}
                                  {watchlistStageLabels[task.watchlist.stage]}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <StatusPill tone={priorityTone[task.watchlist.priority]}>{task.watchlist.priority}</StatusPill>
                                <StatusPill tone={task.dueAt && task.dueAt < new Date(new Date().toDateString()) ? "danger" : "info"}>
                                  {task.dueAt ? task.dueAt.toLocaleDateString("en-US", { dateStyle: "medium" }) : "No due date"}
                                </StatusPill>
                              </div>
                            </div>

                            <p className="mt-3 text-sm text-[var(--foreground)]">Current owner: {task.assigneeLabel}</p>

                            <form action={updateTaskAssignment} className="mt-4 grid gap-3 md:grid-cols-[0.9fr_1.1fr_auto]">
                              <input type="hidden" name="taskId" value={task.id} />
                              <select
                                name="assigneeRole"
                                defaultValue={task.assigneeRole ?? "BUYER"}
                                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                              >
                                {Object.entries(userRoleLabels).map(([role, label]) => (
                                  <option key={role} value={role}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                              <select
                                name="assigneeUserId"
                                defaultValue={task.assigneeUserId ?? ""}
                                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                              >
                                <option value="">Assign to role queue only</option>
                                {workspace.teamMembers.map((member) => (
                                  <option key={member.id} value={member.id}>
                                    {(member.name ?? member.email)} - {userRoleLabels[member.role]}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                              >
                                Reassign
                              </button>
                            </form>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                    <p className="font-medium text-[var(--navy)]">Assignment changes need Owner or Admin access</p>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                      You can inspect workload from this page, but queue rebalancing is limited to tenant managers.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Capacity Settings">
              <div className="mt-5 space-y-4">
                <p className="text-sm text-[var(--foreground-muted)]">
                  Define how much concurrent work each lane should carry before Carvia starts flagging overload and stale-task risk.
                </p>
                {canManageTeam ? (
                  <form action={updateCapacitySettings} className="grid gap-4">
                    <input
                      name="buyerWipLimit"
                      type="number"
                      min={1}
                      defaultValue={workspace.capacitySettings.buyerWipLimit}
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                    />
                    <input
                      name="salesWipLimit"
                      type="number"
                      min={1}
                      defaultValue={workspace.capacitySettings.salesWipLimit}
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                    />
                    <input
                      name="adminWipLimit"
                      type="number"
                      min={1}
                      defaultValue={workspace.capacitySettings.adminWipLimit}
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                    />
                    <input
                      name="taskSlaDays"
                      type="number"
                      min={1}
                      defaultValue={workspace.capacitySettings.taskSlaDays}
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Save capacity settings
                    </button>
                  </form>
                ) : (
                  <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                    <p className="font-medium text-[var(--navy)]">Capacity settings need Owner or Admin access</p>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                      WIP and SLA controls are visible here, but only tenant managers can change these thresholds.
                    </p>
                  </div>
                )}
              </div>
            </Card>

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
                {workspace.rebalanceSuggestions.length > 0 ? (
                  <div className="rounded-3xl border border-[rgba(190,63,51,0.2)] bg-[rgba(190,63,51,0.08)] p-4">
                    <p className="font-medium text-[var(--navy)]">Recommended rebalancing</p>
                    <div className="mt-3 space-y-2">
                      {workspace.rebalanceSuggestions.map((suggestion) => (
                        <div
                          key={`${suggestion.fromRole}-${suggestion.toRole}`}
                          className="rounded-2xl border border-[rgba(190,63,51,0.14)] bg-white/70 p-3"
                        >
                          <p className="text-sm text-[var(--foreground)]">
                            {userRoleLabels[suggestion.fromRole]} {"->"} {userRoleLabels[suggestion.toRole]}: {suggestion.reason}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                            Affects {suggestion.affectedTaskCount} open tasks
                          </p>
                          {canManageTeam ? (
                            <form action={applyRebalanceSuggestion} className="mt-3">
                              <input type="hidden" name="fromRole" value={suggestion.fromRole} />
                              <input type="hidden" name="toRole" value={suggestion.toRole} />
                              <button
                                type="submit"
                                className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                              >
                                Apply suggestion
                              </button>
                            </form>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
