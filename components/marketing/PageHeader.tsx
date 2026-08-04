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
    <div className="border-b border-[rgba(125,211,252,0.1)] bg-[#0f1524] px-4 py-16 text-center sm:px-6 lg:px-8">
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7dd3fc]">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[#e0e8f0] sm:text-4xl md:text-5xl">
        {title}
      </h1>
      {lede && (
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#a0b4c4]">
          {lede}
        </p>
      )}
    </div>
  );
}
