import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoPageEditorForm from "@/components/admin/SeoPageEditorForm";
import { getSeoPageByIdAdmin } from "@/lib/data/admin/seoPages";
import { getAllToursAdmin } from "@/lib/data/admin/tours";

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

  tours.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{page.title}</h1>
      </div>
      <SeoPageEditorForm mode="edit" pageId={pageId} initialPage={page} tours={tours} />
    </div>
  );
}
