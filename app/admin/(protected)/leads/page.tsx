import Link from "next/link";
import type { Metadata } from "next";
import { getAllLeadsAdmin } from "@/lib/data/admin/leads";
import type { Lead } from "@/lib/types";

export const metadata: Metadata = { title: "Leads" };

export default async function AdminLeadsPage() {
  const rows = await getAllLeadsAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Leads</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {rows.length} lead{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/admin/leads/new"
          className="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
        >
          + New lead
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">
          No leads yet.
        </p>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line bg-sand-warm/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Tour / Destination</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ lead, tour }) => (
                <tr key={lead.leadId} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{lead.name ?? "—"}</p>
                    {lead.email && <p className="text-xs text-ink-muted">{lead.email}</p>}
                    {lead.phone && <p className="text-xs text-ink-muted">{lead.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {tour?.title ?? lead.destination ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge source={lead.source} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {new Date(lead.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
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

const STATUS_STYLES: Record<Lead["status"], string> = {
  new: "bg-gold/15 text-terracotta-dark",
  contacted: "bg-navy/10 text-navy",
  converted: "bg-olive/15 text-olive",
  closed: "bg-ink-muted/15 text-ink-muted",
};

function StatusBadge({ status }: { status: Lead["status"] }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

const SOURCE_LABELS: Record<Lead["source"], string> = {
  contact: "Contact form",
  custom: "Custom tour",
  evergreen: "Evergreen",
  manual: "Manual",
};

function SourceBadge({ source }: { source: Lead["source"] }) {
  return (
    <span className="inline-block rounded-full bg-sand-warm px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
      {SOURCE_LABELS[source]}
    </span>
  );
}
