import Link from "next/link";
import BrandLogo from "@/components/marketing/BrandLogo";
import SignOutButton from "@/components/admin/SignOutButton";
import AdminFeedbackProvider from "@/components/admin/feedback/AdminFeedbackProvider";
import { canAccessAdminPath, roleLabel, type AdminRole } from "@/lib/auth/roles";

const NAV_SECTIONS: {
  title: string;
  items: { label: string; href: string; comingSoon?: boolean }[];
}[] = [
  {
    title: "Catalog",
    items: [
      { label: "Tours", href: "/admin/tours" },
      { label: "Bookings", href: "/admin/bookings" },
      { label: "History", href: "/admin/history" },
      { label: "Leads", href: "/admin/leads" },
      { label: "Reviews", href: "/admin/reviews" },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Site Content", href: "/admin/site-content" },
      { label: "Blog", href: "/admin/blog" },
      { label: "Special Offers", href: "/admin/offers" },
      { label: "SEO Landing Pages", href: "/admin/seo-pages" },
      { label: "Image Library", href: "/admin/media" },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Team", href: "/admin/staff/team" },
      { label: "Admin accounts", href: "/admin/staff/accounts" },
      { label: "Settings", href: "/admin/settings" },
      { label: "My account", href: "/admin/account" },
    ],
  },
];

export default function AdminShell({
  email,
  role,
  children,
}: {
  email: string | null;
  role: AdminRole;
  children: React.ReactNode;
}) {
  // Only what this role can open (lib/auth/roles.ts) — e.g. Admin accounts is
  // hidden unless you're a developer or super admin.
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canAccessAdminPath(role, item.href)),
  })).filter((section) => section.items.length > 0);

  return (
    <AdminFeedbackProvider>
      <div className="flex min-h-screen bg-sand-warm">
        <aside className="hidden w-64 shrink-0 flex-col border-e border-line bg-white md:flex">
          <div className="border-b border-line px-5 py-5">
            <BrandLogo className="h-9 w-auto object-contain" href="/admin" />
          </div>
          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
            {sections.map((section) => (
              <div key={section.title}>
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) =>
                    item.comingSoon ? (
                      <li key={item.label}>
                        <span className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[15px] text-ink-muted/50">
                          {item.label}
                          <span className="text-[10px] font-semibold uppercase tracking-wide">
                            Soon
                          </span>
                        </span>
                      </li>
                    ) : (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="block rounded-lg px-2.5 py-2 text-[15px] font-medium text-ink transition-colors hover:bg-sand-warm"
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </nav>
          <div className="border-t border-line px-4 py-4">
            {email && (
              <Link
                href="/admin/account"
                className="mb-2 block truncate text-xs text-ink-muted hover:text-ink hover:underline"
                title={`${email} — My account`}
              >
                {email}
              </Link>
            )}
            <p className="mb-2 text-xs font-medium text-ink-muted">{roleLabel(role)}</p>
            <SignOutButton />
          </div>
        </aside>

        <div className="flex-1">
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">{children}</main>
        </div>
      </div>
    </AdminFeedbackProvider>
  );
}
