import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoPageEditorForm from "@/components/admin/SeoPageEditorForm";
import { getSeoPageByIdAdmin } from "@/lib/data/admin/seoPages";
import { getAllToursAdmin } from "@/lib/data/admin/tours";
import { getAdminSession } from "@/lib/auth/dal";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteSeoPage } from "@/lib/actions/deletions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageId: string }>;
}): Promise<Metadata> {
  const { pageId } = await params;
  const page = await getSeoPageByIdAdmin(pageId);
  return { title: page ? `Edit — ${page.title}` : "SEO landing page" };
}

export default async function EditSeoPagePage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const [page, tours] = await Promise.all([getSeoPageByIdAdmin(pageId), getAllToursAdmin()]);
  if (!page) notFound();
  const isAdmin = (await getAdminSession())?.role === "admin";

  tours.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <DeleteButton action={deleteSeoPage.bind(null, pageId)} what="this SEO page" redirectTo="/admin/seo-pages" />
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{page.title}</h1>
      </div>
      <SeoPageEditorForm mode="edit" pageId={pageId} initialPage={page} tours={tours} />
    </div>
  );
}
