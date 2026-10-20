/**
 * Passport scans live under a private Storage prefix with no download token,
 * so the only way to read one is the admin-only route at
 * app/admin/(protected)/passport-scans/[file]/route.ts. Shared by the upload
 * action, the booking schema, that route and the admin booking modal.
 */
export const PASSPORT_SCANS_PREFIX = "passport-scans/";

/** Exactly what uploadPassportScan writes: passport-scans/<uuid>.<ext>. */
export const PASSPORT_SCAN_FILE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|pdf)$/;

export function isPassportScanPath(path: string): boolean {
  return (
    path.startsWith(PASSPORT_SCANS_PREFIX) &&
    PASSPORT_SCAN_FILE_PATTERN.test(path.slice(PASSPORT_SCANS_PREFIX.length))
  );
}

/**
 * The scan's Storage path for a traveler. Bookings made before scans went
 * private stored a tokenized download URL instead (`passportScanUrl`) — the
 * path is recovered from it so those still open through the admin route.
 */
export function passportScanPathOf(traveler: {
  passportScanPath?: string;
  passportScanUrl?: string;
}): string | null {
  if (traveler.passportScanPath && isPassportScanPath(traveler.passportScanPath)) {
    return traveler.passportScanPath;
  }
  if (traveler.passportScanUrl) {
    const match = traveler.passportScanUrl.match(/\/o\/([^?]+)/);
    const path = match ? decodeURIComponent(match[1]) : "";
    if (isPassportScanPath(path)) return path;
  }
  return null;
}

/** Admin-only viewer URL for a scan path. */
export function passportScanHref(path: string): string {
  return `/admin/passport-scans/${path.slice(PASSPORT_SCANS_PREFIX.length)}`;
}
