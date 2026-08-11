/**
 * Shown instantly by Next.js while a marketing route's Server Component
 * data (Firestore reads) is still resolving, so a header nav click never
 * looks frozen — see the home page's `getHomeData` cache for why the
 * homepage in particular used to stall here for seconds.
 */
export default function MarketingLoading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div
        aria-label="Loading"
        className="size-10 animate-spin rounded-full border-2 border-[#7dd3fc]/20 border-t-[#7dd3fc]"
      />
    </div>
  );
}
