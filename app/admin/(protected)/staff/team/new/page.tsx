import type { Metadata } from "next";
import StaffMemberForm from "@/components/admin/StaffMemberForm";

export const metadata: Metadata = { title: "New team member" };

export default function NewStaffMemberPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">New team member</h1>
      </div>
      <StaffMemberForm mode="create" />
    </div>
  );
}
