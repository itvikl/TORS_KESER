import Link from "next/link";
import type { Metadata } from "next";
import { getAllLeadsAdmin } from "@/lib/data/admin/leads";
import LeadStatusSelect from "@/components/admin/LeadStatusSelect";
import LeadMessagePreview from "@/components/admin/LeadMessagePreview";
import { LEAD_SOURCE_LABELS } from "@/lib/leadLabels";
import type { Lead } from "@/lib/types";
import { IconLink } from "@/components/admin/IconAction";
import { AdminIcon } from "@/components/admin/IconAction";

export const metadata: Metadata = { title: "Leads" };

export default async function AdminLeadsPage() {
  const rows = await getAllLeadsAdmin(); // newest first

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Leads</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {rows.length} lead{rows.length === 1 ? "" : "s"} · newest first
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {rows.length > 0 && (
            // A file download (route handler), not a page — <Link> would try a client-side navigation.
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a
              href="/admin/leads/export"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sand-warm"
            >
              <AdminIcon name="download" className="h-4 w-4" />
              Export to Excel
            </a>
          )}
          <Link
            href="/admin/leads/new"
            className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
          >
            + New lead
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">
          No leads yet.
        </p>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="border-b border-line bg-sand-warm/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Tour / Destination</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ lead, tour }) => (
                <tr key={lead.leadId} className="align-top">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/leads/${lead.leadId}`}
                      className="font-semibold text-ink hover:text-navy"
                    >
                      {lead.name ?? "—"}
                    </Link>
                    {lead.email && <p className="text-xs text-ink-muted">{lead.email}</p>}
                    {lead.phone && <p className="text-xs text-ink-muted">{lead.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <LeadMessagePreview message={lead.message} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {tour?.title ?? lead.destination ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge source={lead.source} />
                  </td>
                  <td className="px-4 py-3">
                    <LeadStatusSelect leadId={lead.leadId} status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    <p className="line-clamp-2 max-w-56 text-xs" title={lead.notes}>
                      {lead.notes ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {new Date(lead.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <IconLink href={`/admin/leads/${lead.leadId}`} icon="edit" label="Edit" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: Lead["source"] }) {
  return (
    <span className="inline-block rounded-full bg-sand-warm px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
      {LEAD_SOURCE_LABELS[source]}
    </span>
  );
}
