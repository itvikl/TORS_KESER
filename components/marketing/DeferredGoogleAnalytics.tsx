import Script from "next/script";

/**
 * GA4 like @next/third-parties' <GoogleAnalytics>, except the gtag library is
 * fetched with `lazyOnload` (browser idle after the page's load event)
 * instead of right after hydration. In PageSpeed, gtag — plus the extra
 * copies the linked Google tag pulls in — cost over a second of main-thread
 * time competing with the first render. The tiny inline init still runs
 * early, so the page_view queued in dataLayer is sent as soon as gtag lands.
 */
export default function DeferredGoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});`}
      </Script>
      <Script
        id="ga-lib"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
      />
    </>
  );
}
