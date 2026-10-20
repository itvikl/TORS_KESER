import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/dal";
import { adminStorage } from "@/lib/firebase/admin";
import { PASSPORT_SCAN_FILE_PATTERN, PASSPORT_SCANS_PREFIX } from "@/lib/passportScans";

/**
 * Streams a private passport scan to a signed-in admin/staff user. The file
 * has no public download token (see uploadPassportScan), so this route —
 * session-checked here and in proxy.ts — is the only way to read it. Bytes
 * pass through the server rather than a signed URL, so no shareable link to
 * the passport ever exists.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  await requireAdminSession();

  const { file } = await params;
  if (!PASSPORT_SCAN_FILE_PATTERN.test(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const blob = adminStorage().bucket().file(`${PASSPORT_SCANS_PREFIX}${file}`);
  const [exists] = await blob.exists();
  if (!exists) {
    return new NextResponse("Not found", { status: 404 });
  }

  const [[metadata], [contents]] = await Promise.all([blob.getMetadata(), blob.download()]);
  return new NextResponse(new Uint8Array(contents), {
    headers: {
      "Content-Type": metadata.contentType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="passport-${file}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
