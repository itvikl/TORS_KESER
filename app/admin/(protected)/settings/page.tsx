import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data/admin/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Global defaults used across new tours and bookings.</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
