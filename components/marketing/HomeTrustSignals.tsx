import type { SiteContentTrustSignal } from "@/lib/types";

export default function HomeTrustSignals({ signals }: { signals: SiteContentTrustSignal[] }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
      {signals.map((signal, index) => (
        <div
          key={index}
          className="glass-card rounded-3xl p-8 text-center shadow-2xl backdrop-blur-lg duration-300"
        >
          <h3 className="text-xl font-bold text-[var(--color-mist)]">{signal.title}</h3>
          <p className="mt-3 text-[15px] leading-7 text-[var(--color-slate)]">{signal.body}</p>
        </div>
      ))}
    </div>
  );
}
