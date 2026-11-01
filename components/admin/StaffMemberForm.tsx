"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDirtyDraft, useGuardedNavigate, useToast } from "@/components/admin/feedback/AdminFeedbackProvider";
import { saveStaffMember } from "@/lib/actions/staff";
import ImageUploadButton from "@/components/admin/ImageUploadButton";
import type { Staff } from "@/lib/types";

const BLANK: Staff = { staffId: "", name: "", role: "guide", bio: undefined, photo: undefined };

export default function StaffMemberForm({
  mode,
  staffId,
  initialStaff,
}: {
  mode: "create" | "edit";
  staffId?: string;
  initialStaff?: Staff;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Staff>(initialStaff ?? BLANK);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const navigate = useGuardedNavigate();
  useDirtyDraft(draft);

  function set<K extends keyof Staff>(key: K, value: Staff[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setErrors({});

    let result;
    try {
      result = await saveStaffMember(draft, staffId);
    } catch {
      setSaving(false);
      toast.error({ title: "Save failed", description: "Something went wrong on the server — please try again." });
      return;
    }
    if (!result.ok) {
      setErrors(result.errors);
      setSaving(false);
      toast.error({ title: "Team member not saved", description: "Please fix the highlighted fields and try again." });
      return;
    }

    toast.success(mode === "create" ? { title: "Team member added", description: `${draft.name} was added to the team.` } : "Team member updated");
    await navigate("/admin/staff/team", { skipConfirm: true });
    if (mode === "create") router.refresh();
  }

  return (
    <div className="max-w-xl space-y-4 rounded-xl border border-line bg-white p-6">
      <Field label="Name" error={errors.name}>
        <input
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        />
      </Field>
      <Field label="Role">
        <select
          value={draft.role}
          onChange={(e) => set("role", e.target.value as Staff["role"])}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        >
          <option value="guide">Guide</option>
          <option value="kashrutSupervisor">Kashrut supervisor</option>
        </select>
      </Field>
      <Field label="Gender">
        <select
          value={draft.gender ?? ""}
          onChange={(e) => set("gender", (e.target.value || undefined) as Staff["gender"])}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        >
          <option value="">Not set</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <p className="mt-1 text-xs text-ink-muted">
          Used for the placeholder avatar on tour pages when there&apos;s no photo.
        </p>
      </Field>
      <Field label="Bio">
        <textarea
          value={draft.bio ?? ""}
          onChange={(e) => set("bio", e.target.value || undefined)}
          rows={4}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        />
      </Field>
      <Field label="Photo">
        <div className="flex items-center gap-3">
          {draft.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
          )}
          <ImageUploadButton
            label={draft.photo ? "Replace photo" : "Upload photo"}
            folder="staff"
            onUploaded={(urls) => set("photo", urls[0])}
          />
        </div>
      </Field>

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-terracotta-dark">{error[0]}</p>}
    </div>
  );
}
