const NAVY = "#1b3a5c";
const GOLD = "#c9a24b";
const SAND = "#f7f1e6";
const INK = "#241f18";
const INK_MUTED = "#5a5245";
const LINE = "#e4d9c2";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatDateRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
  return `${new Date(startIso).toLocaleDateString("en-US", opts)} – ${new Date(endIso).toLocaleDateString("en-US", opts)}`;
}

/** Shared HTML shell for transactional email — inline styles only, per email client constraints. */
export function wrapEmail(preheader: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:${SAND};font-family:Georgia,'Times New Roman',serif;color:${INK};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SAND};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:${NAVY};padding:24px 32px;">
                <span style="color:${GOLD};font-size:20px;font-weight:700;letter-spacing:0.02em;">Keshertours</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid ${LINE};color:${INK_MUTED};font-size:12px;">
                Keshertours — Travel the World the Jewish Way
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function summaryRow(label: string, value: string): string {
  return `<tr><td style="padding:6px 0;color:${INK_MUTED};font-size:14px;">${escapeHtml(label)}</td><td style="padding:6px 0;text-align:right;font-size:14px;">${escapeHtml(value)}</td></tr>`;
}

export function summaryTable(rows: string): string {
  return `<table role="presentation" width="100%" style="margin:0 0 20px;border-collapse:collapse;">${rows}</table>`;
}
