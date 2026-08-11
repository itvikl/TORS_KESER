"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderTours } from "@/lib/actions/tours";
import { formatUsd } from "@/lib/pricing";
import type { Tour, TourStatus } from "@/lib/types";
import ArchiveTourButton from "@/components/admin/ArchiveTourButton";

export interface UpcomingCapacity {
  departureCount: number;
  totalCapacity: number;
  totalAvailable: number;
}

interface TourRowData {
  tour: Tour;
  capacity: UpcomingCapacity;
}

export default function SortableToursTable({ rows: initialRows }: { rows: TourRowData[] }) {
  const [rows, setRows] = useState(initialRows);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rows.findIndex((r) => r.tour.tourId === active.id);
    const newIndex = rows.findIndex((r) => r.tour.tourId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(rows, oldIndex, newIndex);
    setRows(reordered);

    startTransition(async () => {
      const result = await reorderTours(reordered.map((r) => r.tour.tourId));
      if (!result.ok) setRows(rows); // revert on failure
    });
  }

  return (
    <div className="overflow-hidden overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-line bg-sand-warm/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="w-8 px-2 py-3" />
            <th className="px-4 py-3">Tour</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Region</th>
            <th className="px-4 py-3">From</th>
            <th className="px-4 py-3">Capacity</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={rows.map((r) => r.tour.tourId)}
            strategy={verticalListSortingStrategy}
          >
            <tbody className="divide-y divide-line">
              {rows.map(({ tour, capacity }) => (
                <SortableTourRow key={tour.tourId} tour={tour} capacity={capacity} />
              ))}
            </tbody>
          </SortableContext>
        </DndContext>
      </table>
    </div>
  );
}

function SortableTourRow({ tour, capacity }: TourRowData) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tour.tourId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="align-middle bg-white">
      <td className="px-2 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none px-1 text-ink-muted active:cursor-grabbing"
          aria-label={`Reorder ${tour.title}`}
        >
          ⠿
        </button>
      </td>
      <td className="px-4 py-3">
        <p className="font-semibold text-ink">{tour.title}</p>
        <p className="text-xs text-ink-muted">/{tour.slug}</p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={tour.status} />
      </td>
      <td className="px-4 py-3 text-ink-muted">{tour.region}</td>
      <td className="px-4 py-3 text-ink-muted">
        {formatUsd(tour.pricing.pricePerPersonDouble)}
      </td>
      <td className="px-4 py-3">
        {capacity.departureCount === 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta/10 px-2.5 py-0.5 text-xs font-semibold text-terracotta-dark">
            No future dates
          </span>
        ) : (
          <div>
            <p className="font-medium text-ink">
              {capacity.totalAvailable} / {capacity.totalCapacity} left
            </p>
            <p className="text-xs text-ink-muted">
              {capacity.departureCount} upcoming departure{capacity.departureCount === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-3">
          <Link
            href={`/admin/tours/${tour.tourId}/preview`}
            className="text-sm font-medium text-ink-muted hover:text-ink"
            target="_blank"
          >
            Preview
          </Link>
          <Link
            href={`/admin/tours/${tour.tourId}/departures`}
            className="text-sm font-medium text-navy hover:text-navy-light"
          >
            Departures
          </Link>
          <Link
            href={`/admin/tours/${tour.tourId}`}
            className="text-sm font-medium text-navy hover:text-navy-light"
          >
            Edit
          </Link>
          {tour.status !== "archived" && (
            <ArchiveTourButton tourId={tour.tourId} title={tour.title} />
          )}
        </div>
      </td>
    </tr>
  );
}

const STATUS_STYLES: Record<TourStatus, string> = {
  draft: "bg-gold/15 text-terracotta-dark",
  published: "bg-olive/15 text-olive",
  archived: "bg-ink-muted/15 text-ink-muted",
};

function StatusBadge({ status }: { status: TourStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
