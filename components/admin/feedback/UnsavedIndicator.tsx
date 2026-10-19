/** Small pill shown next to Save buttons while a form has unsaved changes. */
export default function UnsavedIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-[#8a6a22]">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
      Unsaved changes
    </span>
  );
}
