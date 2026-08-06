import type { Metadata } from "next";
import { getAllToursAdmin } from "@/lib/data/admin/tours";
import OfferEditorForm from "@/components/admin/OfferEditorForm";

export const metadata: Metadata = { title: "New offer" };

export default async function NewOfferPage() {
  const tours = await getAllToursAdmin();
  tours.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">New offer</h1>
      </div>
      <OfferEditorForm mode="create" tours={tours} />
    </div>
  );
}
