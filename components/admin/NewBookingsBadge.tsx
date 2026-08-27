export default function NewBookingsBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="mb-1 inline-flex w-fit items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      {count} new
    </span>
  );
}
