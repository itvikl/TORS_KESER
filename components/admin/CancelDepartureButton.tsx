"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelDeparture } from "@/lib/actions/departures";
import { IconButton } from "@/components/admin/IconAction";
import { useConfirm, useToast } from "@/components/admin/feedback/AdminFeedbackProvider";

export default function CancelDepartureButton({
  departureId,
  tourId,
  label,
}: {
  departureId: string;
  tourId: string;
  label: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    const ok = await confirm({
      title: `Cancel “${label}”?`,
      description: "This departure date will be marked as cancelled and closed for new bookings.",
      confirmLabel: "Cancel date",
      cancelLabel: "Keep date",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await cancelDeparture(departureId, tourId);
        toast.success({ title: "Date cancelled", description: `“${label}” is now cancelled.` });
        router.refresh();
      } catch {
        toast.error({ title: "Couldn't cancel date", description: "Something went wrong — please try again." });
      }
    });
  }

  return (
    <IconButton icon="ban" label="Cancel this date" tone="danger" disabled={pending} onClick={handleClick} />
  );
}
