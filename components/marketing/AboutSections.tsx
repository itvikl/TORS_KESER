import type { SiteContentSection } from "@/lib/types";

export default function AboutSections({ sections }: { sections: SiteContentSection[] }) {
  return (
    <>
      {sections.map((section, index) => (
        <section
          key={section.sectionId}
          className={`glass-panel rounded-2xl p-6 sm:p-8 ${index > 0 ? "mt-8" : ""}`}
        >
          <h2 className="text-2xl font-bold tracking-tight text-[#7dd3fc]">{section.heading}</h2>
          <p className="mt-4 text-lg leading-relaxed text-[#a0b4c4]">{section.body}</p>
        </section>
      ))}
    </>
  );
}
