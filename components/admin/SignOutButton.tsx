"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-sand-warm hover:text-ink"
    >
      Sign out
    </button>
  );
}
