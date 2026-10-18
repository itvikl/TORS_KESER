import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StaffMemberForm from "@/components/admin/StaffMemberForm";
import { getStaffByIdAdmin } from "@/lib/data/admin/staff";
import { getAdminSession } from "@/lib/auth/dal";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteStaffMember } from "@/lib/actions/deletions";

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
  const isAdmin = (await getAdminSession())?.role === "admin";

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <DeleteButton action={deleteStaffMember.bind(null, staffId)} what="this team member" redirectTo="/admin/staff/team" />
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{staff.name}</h1>
      </div>
      <StaffMemberForm mode="edit" staffId={staffId} initialStaff={staff} />
    </div>
  );
}
