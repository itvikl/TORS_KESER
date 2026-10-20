import { NextResponse, type NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/auth/dal";
import { getAllLeadsAdmin } from "@/lib/data/admin/leads";
import { buildLeadsWorkbook } from "@/lib/export/leadsWorkbook";
import { parseDateRangeFilter } from "@/lib/dateRangeFilter";

/** Excel download of leads, newest first, honoring the same ?from=&to= filter as the page. */
export async function GET(request: NextRequest) {
  await requireAdminSession();

  const searchParams = request.nextUrl.searchParams;
  const filter = parseDateRangeFilter({ from: searchParams.get("from"), to: searchParams.get("to") });

  const buffer = await buildLeadsWorkbook(await getAllLeadsAdmin(filter));
  const today = new Date().toISOString().slice(0, 10);
  const range = [filter.from, filter.to].filter(Boolean).join("_to_");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="leads-${range || today}.xlsx"`,
    },
  });
}
