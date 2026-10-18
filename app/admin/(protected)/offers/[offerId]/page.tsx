import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OfferEditorForm from "@/components/admin/OfferEditorForm";
import { getOfferByIdAdmin } from "@/lib/data/admin/offers";
import { getAllToursAdmin } from "@/lib/data/admin/tours";
import { getAdminSession } from "@/lib/auth/dal";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteOffer } from "@/lib/actions/deletions";

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
  const isAdmin = (await getAdminSession())?.role === "admin";

  tours.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <DeleteButton action={deleteOffer.bind(null, offerId)} what="this offer" redirectTo="/admin/offers" />
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{offer.title}</h1>
      </div>
      <OfferEditorForm mode="edit" offerId={offerId} initialOffer={offer} tours={tours} />
    </div>
  );
}
