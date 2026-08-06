import Link from "next/link";
import type { Metadata } from "next";
import { getAllOffersAdmin } from "@/lib/data/admin/offers";
import type { SpecialOffer } from "@/lib/types";

export const metadata: Metadata = { title: "Special Offers" };

export default async function AdminOffersPage() {
  const offers = await getAllOffersAdmin();
  offers.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Special Offers</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {offers.length} offer{offers.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/admin/offers/new"
          className="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
        >
          + New offer
        </Link>
      </div>

      {offers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">
          No offers yet. Create the first one to get started.
        </p>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-line bg-sand-warm/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Offer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Valid until</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {offers.map((offer) => (
                <tr key={offer.offerId} className="align-middle">
                  <td className="px-4 py-3 font-semibold text-ink">{offer.title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={offer.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{offer.validUntil ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/offers/${offer.offerId}`}
                      className="text-sm font-medium text-navy hover:text-navy-light"
                    >
                      Edit
                    </Link>
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

const STATUS_STYLES: Record<SpecialOffer["status"], string> = {
  draft: "bg-gold/15 text-terracotta-dark",
  published: "bg-olive/15 text-olive",
};

function StatusBadge({ status }: { status: SpecialOffer["status"] }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
