import Link from "next/link";
import type { Metadata } from "next";
import { getAllStaffAdmin } from "@/lib/data/admin/staff";

export const metadata: Metadata = { title: "Team" };

export default async function AdminStaffTeamPage() {
  const staff = await getAllStaffAdmin();
  staff.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Team</h1>
          <p className="mt-1 text-sm text-ink-muted">Guides and kashrut supervisors assigned to departures.</p>
        </div>
        <Link
          href="/admin/staff/team/new"
          className="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
        >
          + New team member
        </Link>
      </div>

      {staff.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">
          No team members yet.
        </p>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead className="border-b border-line bg-sand-warm/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {staff.map((member) => (
                <tr key={member.staffId} className="align-middle">
                  <td className="px-4 py-3 font-semibold text-ink">{member.name}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {member.role === "guide" ? "Guide" : "Kashrut supervisor"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/staff/team/${member.staffId}`}
                      className="text-sm font-medium text-navy hover:text-navy-light"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
