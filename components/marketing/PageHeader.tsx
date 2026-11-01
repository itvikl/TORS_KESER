import Image from "next/image";

export default function PageHeader({
  eyebrow,
  title,
  lede,
  image,
  transparent = false,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  /** Optional banner photo behind the title (set per page in Admin → Site content). Without it the header is the plain banner. */
  image?: string;
  /** Skip the opaque section background — for pages that render their own backdrop (e.g. the booking page's photo background) behind this header. */
  transparent?: boolean;
}) {
  if (image) {
    // Over a photo the text is always light, whatever the site theme: the
    // darkened overlay (not the theme) is what it has to read against.
    return (
      <div className="relative isolate overflow-hidden border-b border-[var(--color-border-ice)] px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-[rgba(10,14,26,0.55)] via-[rgba(10,14,26,0.5)] to-[rgba(10,14,26,0.85)]"
          aria-hidden="true"
        />
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7dd3fc]">{eyebrow}</p>
        )}
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {lede && <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/85">{lede}</p>}
      </div>
    );
  }

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
