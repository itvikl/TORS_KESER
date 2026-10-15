import { NextResponse, type NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/auth/dal";
import {
  getDepartureRegistrantsAdmin,
  getPastDeparturesAdmin,
  parseHistoryDateFilter,
} from "@/lib/data/admin/history";
import { buildHistoryWorkbook } from "@/lib/export/historyWorkbook";

/** Excel download of the history list, honoring the same ?from=&to= filter as the page. */
export async function GET(request: NextRequest) {
  await requireAdminSession();

  const searchParams = request.nextUrl.searchParams;
  const filter = parseHistoryDateFilter({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  const rows = await getPastDeparturesAdmin(filter);
  const results = await Promise.all(
    rows.map(({ departure }) => getDepartureRegistrantsAdmin(departure.departureId))
  );
  const buffer = await buildHistoryWorkbook(results);

  const range = [filter.from, filter.to].filter(Boolean).join("_to_") || "all";
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="history-${range}.xlsx"`,
    },
  });
}
