export default function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="border-b border-line bg-sand-warm px-4 py-14 text-center sm:px-6">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
        {title}
      </h1>
      {lede && (
        <p className="mx-auto mt-3 max-w-2xl text-lg text-ink-muted">{lede}</p>
      )}
    </div>
  );
}
