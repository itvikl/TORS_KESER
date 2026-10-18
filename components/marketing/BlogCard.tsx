import Link from "next/link";
import type { BlogPost } from "@/lib/types";
import SafeImage from "@/components/ui/SafeImage";

// Stock placeholder for the handful of migrated posts with no featured
// image on the old site — same fallback pattern as tour cards
// (app/(marketing)/page.tsx's FEATURED_IMAGES), just a single image since a
// blog card only ever needs one.
const FALLBACK_IMAGE =
  "https://firebasestorage.googleapis.com/v0/b/kesertors.firebasestorage.app/o/site%2Fstock%2Fhome-hero-a18f8b00.jpg?alt=media&token=e03feebc-914d-423c-8b8b-bd7d3761658c";

function excerpt(body: string, maxLength = 150): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= maxLength) return flat;
  return flat.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="glass-card group flex flex-col overflow-hidden rounded-3xl shadow-2xl backdrop-blur-lg duration-500"
    >
      <div className="relative h-52 overflow-hidden">
        <SafeImage
          src={post.heroImage || FALLBACK_IMAGE}
          alt={post.title}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-110"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        {post.publishedAt && (
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-slate)]">
            {formatDate(post.publishedAt)}
          </span>
        )}
        <h3 className="text-lg font-bold leading-snug text-[var(--color-mist)]">{post.title}</h3>
        <p className="text-sm leading-relaxed text-[var(--color-slate)]">{excerpt(post.body)}</p>

        <span className="mt-auto flex items-center gap-1 pt-2 text-sm font-bold text-[var(--color-ice)] transition-all group-hover:gap-2">
          Read more <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
