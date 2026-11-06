import type { Metadata } from "next";
import { requireContentSession } from "@/lib/auth/dal";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Shared by every admin role; SEO admins are kept to their sections by
  // proxy.ts, and each page/action re-checks with requireAdminSession().
  const session = await requireContentSession();
  return (
    <AdminShell email={session.email} role={session.role}>
      {children}
    </AdminShell>
  );
}
