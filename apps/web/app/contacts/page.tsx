import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { contactChannelLabels, getContactWorkspace } from "../../lib/contacts";
import { requireOnboardedSession } from "../../lib/auth";
import { watchlistStageLabels } from "../../lib/watchlist";
import { deleteWatchlistContact } from "./actions";

const priorityTone = {
  HIGH: "danger",
  LOW: "info",
  MEDIUM: "warning"
} as const;

const channelTone = {
  CALL: "warning",
  EMAIL: "success",
  MESSAGE: "info"
} as const;

export default async function ContactsPage() {
  const session = await requireOnboardedSession();
  const contacts = await getContactWorkspace(session.user.companyId!);
  const emailCount = contacts.filter((contact) => contact.preferredChannel === "EMAIL").length;
  const phoneCount = contacts.filter((contact) => contact.phone).length;
  const recentlyContactedCount = contacts.filter((contact) => contact.lastContactedAt).length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Contacts</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Opportunity contacts</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Keep seller, broker, and verification contacts attached to each tracked vehicle so outreach survives handoffs and follow-up stays structured.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/activities"
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)]"
            >
              Open activity
            </Link>
            <Link
              href="/watchlist"
              className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
            >
              Manage watchlist
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Contacts", value: String(contacts.length), delta: "Tracked people per opportunity" },
            { label: "Email First", value: String(emailCount), delta: "Preferred email contact flow" },
            { label: "With Phone", value: String(phoneCount), delta: "Reachable by direct call" },
            { label: "Contacted", value: String(recentlyContactedCount), delta: "Contacts with last-touch history" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <Card title="Contact Directory">
          <div className="mt-5 space-y-4">
            {contacts.length === 0 ? (
              <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                <p className="font-medium text-[var(--navy)]">No contacts saved yet</p>
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                  Add the first seller or broker contact from the watchlist or analysis detail page.
                </p>
              </div>
            ) : (
              contacts.map((contact) => (
                <div key={contact.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={channelTone[contact.preferredChannel]}>{contactChannelLabels[contact.preferredChannel]}</StatusPill>
                        <StatusPill tone={priorityTone[contact.watchlist.priority]}>{contact.watchlist.priority}</StatusPill>
                      </div>
                      <p className="mt-3 font-medium text-[var(--navy)]">{contact.fullName}</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        {[contact.roleLabel ?? "Role open", contact.companyName ?? "Company open", contact.vehicle ? `${contact.vehicle.make} ${contact.vehicle.model}` : "Tracked vehicle"].join(" | ")}
                      </p>
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)]">{watchlistStageLabels[contact.watchlist.stage]}</p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">Email</p>
                      <p className="mt-2 text-sm text-[var(--navy)]">{contact.email ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">Phone</p>
                      <p className="mt-2 text-sm text-[var(--navy)]">{contact.phone ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">Last contact</p>
                      <p className="mt-2 text-sm text-[var(--navy)]">
                        {contact.lastContactedAt ? contact.lastContactedAt.toLocaleDateString("en-US", { dateStyle: "medium" }) : "-"}
                      </p>
                    </div>
                  </div>

                  {contact.notes ? <p className="mt-4 text-sm text-[var(--foreground)]">{contact.notes}</p> : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/watchlist"
                      className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                    >
                      Open watchlist
                    </Link>
                    <form action={deleteWatchlistContact}>
                      <input type="hidden" name="contactId" value={contact.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-[rgba(190,63,51,0.2)] bg-[rgba(190,63,51,0.08)] px-4 py-2 text-sm font-medium text-[var(--danger)]"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
