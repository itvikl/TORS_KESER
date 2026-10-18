import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLeadByIdAdmin } from "@/lib/data/admin/leads";
import { getAllToursAdmin } from "@/lib/data/admin/tours";
import LeadForm from "@/components/admin/LeadForm";
import { LEAD_SOURCE_LABELS } from "@/lib/leadLabels";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ leadId: string }>;
}): Promise<Metadata> {
  const { leadId } = await params;
  const lead = await getLeadByIdAdmin(leadId);
  return { title: lead ? `Edit — ${lead.name ?? lead.email ?? lead.phone ?? "Lead"}` : "Lead" };
}

export default async function EditLeadPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const [lead, tours] = await Promise.all([getLeadByIdAdmin(leadId), getAllToursAdmin()]);
  if (!lead) notFound();
  tours.sort((a, b) => a.title.localeCompare(b.title));

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div>
      <Link href="/admin/leads" className="text-sm font-medium text-navy hover:text-navy-light">
        ← All leads
      </Link>
      <div className="mb-6 mt-2">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {lead.name ?? lead.email ?? lead.phone ?? "Lead"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {LEAD_SOURCE_LABELS[lead.source]} · received {formatDate(lead.createdAt)}
          {lead.updatedAt && ` · last edited ${formatDate(lead.updatedAt)}`}
        </p>
      </div>
      <LeadForm tours={tours} lead={lead} />
    </div>
  );
}
