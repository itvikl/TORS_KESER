import type { Metadata } from "next";
import { getAllToursAdmin } from "@/lib/data/admin/tours";
import ReviewForm from "@/components/admin/ReviewForm";

export const metadata: Metadata = { title: "New review" };

export default async function NewReviewPage() {
  const tours = await getAllToursAdmin();
  tours.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">New review</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Add a review submitted by email, phone, or another offline channel.
        </p>
      </div>
      <ReviewForm tours={tours} />
    </div>
  );
}
