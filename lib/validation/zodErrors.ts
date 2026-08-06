/**
 * Turns Zod issues into a Record<dottedPath, string[]>, e.g.
 * "kashrutDetails.supervisionLevel" -> ["Required"]. Used by every admin
 * save action so nested/flat form fields can look up their own errors by a
 * single dotted key.
 */
export function zodIssuesToFieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[]
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}
