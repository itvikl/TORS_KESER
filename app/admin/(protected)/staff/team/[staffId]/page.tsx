import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StaffMemberForm from "@/components/admin/StaffMemberForm";
import { getStaffByIdAdmin } from "@/lib/data/admin/staff";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ staffId: string }>;
}): Promise<Metadata> {
  const { staffId } = await params;
  const staff = await getStaffByIdAdmin(staffId);
  return { title: staff ? `Edit — ${staff.name}` : "Team member" };
}

export default async function EditStaffMemberPage({
  params,
}: {
  params: Promise<{ staffId: string }>;
}) {
  const { staffId } = await params;
  const staff = await getStaffByIdAdmin(staffId);
  if (!staff) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{staff.name}</h1>
      </div>
      <StaffMemberForm mode="edit" staffId={staffId} initialStaff={staff} />
    </div>
  );
}
