import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/dal";
import { getAllLeadsAdmin } from "@/lib/data/admin/leads";
import { buildLeadsWorkbook } from "@/lib/export/leadsWorkbook";

/** Excel download of every lead, newest first. */
export async function GET() {
  await requireAdminSession();

  const buffer = await buildLeadsWorkbook(await getAllLeadsAdmin());
  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="leads-${today}.xlsx"`,
    },
  });
}
