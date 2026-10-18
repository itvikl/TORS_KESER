"use server";

import { revalidatePath, updateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdminRole } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { syncContentMediaSafely } from "@/lib/data/admin/mediaLibrary";
import { HOME_TOURS_CACHE_TAG } from "@/lib/data/homeCacheTags";
import type { ContentCollection } from "@/lib/media/assets";

/**
 * Admin-only permanent deletes for everything staff add in the admin
 * (Staff-role users can edit but not delete). Each one cleans up what points
 * at the deleted doc so nothing is left half-linked, and refuses when real
 * customer records depend on it (tours/departures with bookings — archive
 * or cancel those instead). Bookings themselves aren't deletable: they hold
 * payment history.
 */
export type DeleteResult = { ok: true } | { ok: false; error: string };

const db = () => adminDb();

async function deleteContentDoc(collection: ContentCollection | "leads" | "seoLandingPages", id: string) {
  await db().collection(collection).doc(id).delete();
}

async function countBookings(field: "tourId" | "departureId", id: string): Promise<number> {
  return (await db().collection("bookings").where(field, "==", id).count().get()).data().count;
}

/** All public tour pages read reviews/guides, so changes there refresh the tour route as a whole. */
function revalidateTourPages() {
  revalidatePath("/tours/[slug]", "page");
}

export async function deleteTour(tourId: string): Promise<DeleteResult> {
  await requireAdminRole();

  const bookings = await countBookings("tourId", tourId);
  if (bookings > 0) {
    return {
      ok: false,
      error: `This tour has ${bookings} booking${bookings === 1 ? "" : "s"} — archive it instead so those records stay intact.`,
    };
  }

  const tourSnap = await db().collection("tours").doc(tourId).get();
  if (!tourSnap.exists) return { ok: false, error: "Tour not found." };
  const slug = (tourSnap.data() as { slug?: string }).slug;

  // Its departure dates go with it; SEO pages stop listing it.
  const [departures, seoPages] = await Promise.all([
    db().collection("departures").where("tourId", "==", tourId).get(),
    db().collection("seoLandingPages").where("tourIds", "array-contains", tourId).get(),
  ]);
  const batch = db().batch();
  departures.docs.forEach((doc) => batch.delete(doc.ref));
  seoPages.docs.forEach((doc) => batch.update(doc.ref, { tourIds: FieldValue.arrayRemove(tourId) }));
  batch.delete(tourSnap.ref);
  await batch.commit();
  await syncContentMediaSafely("tours", tourId);

  revalidatePath("/admin/tours");
  revalidatePath("/");
  if (slug) revalidatePath(`/tours/${slug}`);
  updateTag(HOME_TOURS_CACHE_TAG);
  return { ok: true };
}

export async function deleteDeparture(departureId: string, tourId: string): Promise<DeleteResult> {
  await requireAdminRole();

  const bookings = await countBookings("departureId", departureId);
  if (bookings > 0) {
    return {
      ok: false,
      error: `This date has ${bookings} booking${bookings === 1 ? "" : "s"} — cancel it instead so those records stay intact.`,
    };
  }

  await db().collection("departures").doc(departureId).delete();
  revalidatePath(`/admin/tours/${tourId}/departures`);
  revalidatePath("/admin/tours");
  revalidateTourPages();
  updateTag(HOME_TOURS_CACHE_TAG);
  return { ok: true };
}

export async function deleteBlogPost(postId: string): Promise<DeleteResult> {
  await requireAdminRole();
  const slug = ((await db().collection("blogPosts").doc(postId).get()).data() as { slug?: string } | undefined)?.slug;
  await deleteContentDoc("blogPosts", postId);
  await syncContentMediaSafely("blogPosts", postId);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteOffer(offerId: string): Promise<DeleteResult> {
  await requireAdminRole();
  await deleteContentDoc("specialOffers", offerId);
  await syncContentMediaSafely("specialOffers", offerId);
  revalidatePath("/admin/offers");
  revalidatePath("/special-offers");
  return { ok: true };
}

export async function deleteSeoPage(pageId: string): Promise<DeleteResult> {
  await requireAdminRole();
  await deleteContentDoc("seoLandingPages", pageId);
  revalidatePath("/admin/seo-pages");
  return { ok: true };
}

export async function deleteLead(leadId: string): Promise<DeleteResult> {
  await requireAdminRole();
  await deleteContentDoc("leads", leadId);
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function deleteReview(reviewId: string): Promise<DeleteResult> {
  await requireAdminRole();
  await deleteContentDoc("reviews", reviewId);
  await syncContentMediaSafely("reviews", reviewId);
  revalidatePath("/admin/reviews");
  revalidatePath("/testimonials");
  revalidateTourPages();
  return { ok: true };
}

/** Also unassigns them from any departure they guide or supervise. */
export async function deleteStaffMember(staffId: string): Promise<DeleteResult> {
  await requireAdminRole();

  const [asGuide, asSupervisor] = await Promise.all([
    db().collection("departures").where("guideId", "==", staffId).get(),
    db().collection("departures").where("kashrutSupervisorId", "==", staffId).get(),
  ]);
  const batch = db().batch();
  asGuide.docs.forEach((doc) => batch.update(doc.ref, { guideId: FieldValue.delete() }));
  asSupervisor.docs.forEach((doc) => batch.update(doc.ref, { kashrutSupervisorId: FieldValue.delete() }));
  batch.delete(db().collection("staff").doc(staffId));
  await batch.commit();
  await syncContentMediaSafely("staff", staffId);

  revalidatePath("/admin/staff/team");
  revalidateTourPages();
  return { ok: true };
}
