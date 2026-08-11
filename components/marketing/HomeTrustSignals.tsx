import type { SiteContentTrustSignal } from "@/lib/types";

export default function HomeTrustSignals({ signals }: { signals: SiteContentTrustSignal[] }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
      {signals.map((signal, index) => (
        <div
          key={index}
          className="rounded-3xl border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.6)] p-8 text-center shadow-2xl backdrop-blur-lg transition-all duration-300 hover:border-[rgba(125,211,252,0.2)] hover:bg-[rgba(15,21,36,0.75)]"
        >
          <h3 className="text-xl font-bold text-[#e0e8f0]">{signal.title}</h3>
          <p className="mt-3 text-[15px] leading-7 text-[#a0b4c4]">{signal.body}</p>
        </div>
      ))}
    </div>
  );
}
