import type { Staff } from "@/lib/types";
import SafeImage from "@/components/ui/SafeImage";

/**
 * A guide's round avatar: their photo when there is one, otherwise a
 * male/female silhouette from Staff.gender (Admin -> Staff -> Team), or a
 * neutral one when no gender is set. The parent sets the size.
 */
export default function GuideAvatar({
  guide,
  className = "h-10 w-10",
  sizes = "40px",
}: {
  guide: Pick<Staff, "name" | "photo" | "gender">;
  className?: string;
  /** next/image sizes hint matching className's width. */
  sizes?: string;
}) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-full bg-[var(--color-surface-hover-b)] ${className}`}
    >
      {guide.photo ? (
        <SafeImage src={guide.photo} alt={guide.name} sizes={sizes} className="object-cover" />
      ) : (
        <Silhouette gender={guide.gender} label={guide.name} />
      )}
    </span>
  );
}

function Silhouette({ gender, label }: { gender?: Staff["gender"]; label: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={label}
      className="h-full w-full text-[var(--color-ice)]/55"
      fill="currentColor"
    >
      {gender === "female" ? (
        <>
          {/* Hair falling to the shoulders behind the head */}
          <path d="M32 11c-10 0-16 7.5-16 17 0 7 1.5 12.5 3.5 16.5h25c2-4 3.5-9.5 3.5-16.5 0-9.5-6-17-16-17z" opacity="0.55" />
          <circle cx="32" cy="27" r="10.5" />
          <path d="M12 64c1.5-11.5 9.5-18.5 20-18.5S50.5 52.5 52 64z" />
        </>
      ) : gender === "male" ? (
        <>
          <circle cx="32" cy="26" r="11" />
          {/* Short hair cap */}
          <path d="M21 24.5c0-7.5 5-12 11-12s11 4.5 11 12c-2.5-3.5-6.5-5-11-5s-8.5 1.5-11 5z" opacity="0.55" />
          <path d="M10 64c1.5-12.5 10.5-19.5 22-19.5S52.5 51.5 54 64z" />
        </>
      ) : (
        <>
          <circle cx="32" cy="26" r="11" />
          <path d="M11 64c1.5-12 10-19 21-19s19.5 7 21 19z" />
        </>
      )}
    </svg>
  );
}
