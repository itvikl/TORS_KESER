import Link from "next/link";

export default function BrandLogo({
  className = "h-11 w-auto object-contain sm:h-12",
  href = "/",
}: {
  className?: string;
  href?: string | null;
}) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/kesher-logo2.png"
      alt="Kesher Kosher Tours"
      className={className}
    />
  );

  if (!href) return image;

  return (
    <Link href={href} className="inline-block shrink-0 transition-opacity hover:opacity-90">
      {image}
    </Link>
  );
}
