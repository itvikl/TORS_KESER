import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OfferEditorForm from "@/components/admin/OfferEditorForm";
import { getOfferByIdAdmin } from "@/lib/data/admin/offers";
import { getAllToursAdmin } from "@/lib/data/admin/tours";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ offerId: string }>;
}): Promise<Metadata> {
  const { offerId } = await params;
  const offer = await getOfferByIdAdmin(offerId);
  return { title: offer ? `Edit — ${offer.title}` : "Offer" };
}

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = await params;
  const [offer, tours] = await Promise.all([getOfferByIdAdmin(offerId), getAllToursAdmin()]);
  if (!offer) notFound();

  tours.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{offer.title}</h1>
      </div>
      <OfferEditorForm mode="edit" offerId={offerId} initialOffer={offer} tours={tours} />
    </div>
  );
}
