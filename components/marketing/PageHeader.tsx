export default function PageHeader({
  eyebrow,
  title,
  lede,
  transparent = false,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  /** Skip the opaque section background — for pages that render their own backdrop (e.g. the booking page's photo background) behind this header. */
  transparent?: boolean;
}) {
  return (
    <div
      className={`px-4 py-16 text-center sm:px-6 lg:px-8 ${
        transparent ? "" : "border-b border-[var(--color-border-ice)] bg-[var(--color-glacier-elevated)]"
      }`}
    >
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-ice)]">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--color-mist)] sm:text-4xl md:text-5xl">
        {title}
      </h1>
      {lede && (
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--color-slate)]">
          {lede}
        </p>
      )}
    </div>
  );
}
