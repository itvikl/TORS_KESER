import { requireContentSession } from "@/lib/auth/dal";
import { getSiteContent } from "@/lib/data/siteContent";
import PreviewFrameClient from "./PreviewFrameClient";

export default async function PreviewFramePage() {
  await requireContentSession(); // SEO admins edit tours too
  return <PreviewFrameClient copy={await getSiteContent("tour-page")} />;
}
