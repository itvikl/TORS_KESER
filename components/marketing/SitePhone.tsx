"use client";

import { createContext, useContext } from "react";
import { DEFAULT_SITE_PHONE, telHref } from "@/lib/sitePhone";

/**
 * The phone number from Admin → Settings, provided once by the marketing
 * layout so every "call us" link on the site shows the same, editable
 * number (it used to be hard-coded in a dozen components).
 */
const SitePhoneContext = createContext(DEFAULT_SITE_PHONE);

export function SitePhoneProvider({ phone, children }: { phone: string; children: React.ReactNode }) {
  return <SitePhoneContext.Provider value={phone || DEFAULT_SITE_PHONE}>{children}</SitePhoneContext.Provider>;
}

export function useSitePhone(): string {
  return useContext(SitePhoneContext);
}

/** A tel: link showing the site phone number, optionally after a short prefix ("Questions? Call "). */
export function PhoneLink({ className, prefix = "" }: { className?: string; prefix?: string }) {
  const phone = useSitePhone();
  return (
    <a href={telHref(phone)} className={className}>
      {prefix}
      {phone}
    </a>
  );
}
