import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { formatBlogDate } from "@/lib/blogDate";
import type { BlogPost } from "@/lib/types";

/**
 * One blog post as visitors see it. Shared by the public /blog/[slug] page
 * and the admin editor's Preview, so the preview can't drift from the site.
 * `bodyHtml` must already be safe HTML.
 */
export default function BlogPostView({
  post,
  bodyHtml,
  backLabel,
}: {
  post: Pick<BlogPost, "title" | "tags" | "heroImage" | "publishedAt">;
  bodyHtml: string;
  backLabel: string;
}) {
  return (
    <div>
      <div className="border-b border-[var(--color-border-ice)] bg-[var(--color-glacier-elevated)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="/blog"
            className="text-sm font-semibold text-[var(--color-ice)] transition-colors hover:brightness-110"
          >
            ← {backLabel}
          </Link>
          {post.publishedAt && (
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-slate)]">
              {formatBlogDate(post.publishedAt)}
            </p>
          )}
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--color-mist)] sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
          {post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--color-border-ice)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-slate)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {post.heroImage && (
        <div className="mx-auto -mt-1 max-w-4xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="relative h-72 overflow-hidden rounded-3xl shadow-2xl sm:h-96">
            <SafeImage src={post.heroImage} alt={post.title} sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-2xl p-6 sm:p-8">
          {/* Callers pass sanitized HTML — see lib/blogBodySanitize.ts. */}
          <div className="rich-body text-[var(--color-mist)]" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </div>
      </div>
    </div>
  );
}
