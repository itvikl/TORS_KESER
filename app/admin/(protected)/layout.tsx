import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/auth/dal";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();
  return <AdminShell email={session.email}>{children}</AdminShell>;
}
