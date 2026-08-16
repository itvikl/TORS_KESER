/**
 * Splits `text` into per-letter spans that drop in from above on mount
 * (pure CSS `@keyframes letter-fall`, see app/globals.css — no JS, no
 * "use client", so it stays safe inside server-rendered trees like the
 * hero and its admin live-preview twin). Each word is wrapped in an
 * overflow-hidden box so falling letters clip at the line instead of
 * spilling into the text above, and `prefers-reduced-motion` is handled
 * globally (globals.css collapses all animation durations to ~0).
 */
export default function LetterDrop({
  text,
  className,
  startDelayMs = 0,
  staggerMs = 22,
}: {
  text: string;
  className?: string;
  startDelayMs?: number;
  staggerMs?: number;
}) {
  const words = text.split(" ");
  let charIndex = 0;

  return (
    <span className={className}>
      {words.map((word, wi) => (
        <span key={wi}>
          <span className="inline-block overflow-hidden pb-[0.15em] align-bottom">
            {word.split("").map((ch, ci) => {
              const delay = startDelayMs + charIndex * staggerMs;
              charIndex += 1;
              return (
                <span
                  key={ci}
                  className="inline-block"
                  style={{
                    animation: "letter-fall 0.6s cubic-bezier(0.22,1,0.36,1) both",
                    animationDelay: `${delay}ms`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </span>
          {wi < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
