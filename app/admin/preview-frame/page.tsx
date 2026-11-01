import { requireAdminSession } from "@/lib/auth/dal";
import { getSiteContent } from "@/lib/data/siteContent";
import PreviewFrameClient from "./PreviewFrameClient";

export default async function PreviewFramePage() {
  await requireAdminSession();
  return <PreviewFrameClient copy={await getSiteContent("tour-page")} />;
}
