"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveTour } from "@/lib/actions/tours";
import { IconButton } from "@/components/admin/IconAction";
import { useConfirm, useToast } from "@/components/admin/feedback/AdminFeedbackProvider";

/** FR-43: no raw delete in the admin — archiving is the only removal action, and stays reachable/301-able. */
export default function ArchiveTourButton({ tourId, title }: { tourId: string; title: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    const ok = await confirm({
      title: `Archive “${title}”?`,
      description: "The tour will be hidden from the site. You can restore it later from the archive.",
      confirmLabel: "Archive",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await archiveTour(tourId);
        toast.success({ title: "Tour archived", description: `“${title}” is no longer shown on the site.` });
        router.refresh();
      } catch {
        toast.error({ title: "Couldn't archive tour", description: "Something went wrong — please try again." });
      }
    });
  }

  return <IconButton icon="archive" label="Archive" tone="danger" disabled={pending} onClick={handleClick} />;
}
