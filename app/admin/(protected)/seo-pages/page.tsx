import Link from "next/link";
import type { Metadata } from "next";
import { getAllSeoPagesAdmin } from "@/lib/data/admin/seoPages";
import type { SeoLandingPage } from "@/lib/types";

export const metadata: Metadata = { title: "SEO Landing Pages" };

export default async function AdminSeoPagesPage() {
  const pages = await getAllSeoPagesAdmin();
  pages.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">SEO Landing Pages</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {pages.length} page{pages.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/admin/seo-pages/new"
          className="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
        >
          + New page
        </Link>
      </div>

      {pages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">
          No landing pages yet.
        </p>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-line bg-sand-warm/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Linked tours</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pages.map((page) => (
                <tr key={page.pageId} className="align-middle">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{page.title}</p>
                    <p className="text-xs text-ink-muted">/{page.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={page.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{page.tourIds.length}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/seo-pages/${page.pageId}`}
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

const STATUS_STYLES: Record<SeoLandingPage["status"], string> = {
  draft: "bg-gold/15 text-terracotta-dark",
  published: "bg-olive/15 text-olive",
};

function StatusBadge({ status }: { status: SeoLandingPage["status"] }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
