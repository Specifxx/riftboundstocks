"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { useEffect } from "react";

// Web Analytics bills per event, so drop the ones that aren't real visitors:
// local and preview hosts, automated browsers, bots, and the owner (visit any
// page with ?notrack=1 to opt out on this browser, ?notrack=0 to opt back in).
// See DECISIONS.md, "Analytics skips bots, previews and the owner".
const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|curl|wget|python|httpclient|axios|node-fetch|phantom|selenium|puppeteer|playwright/i;

function optedOut(): boolean {
  try {
    return window.localStorage.getItem("va-disable") === "1";
  } catch {
    return false;
  }
}

function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app")) return null;
  if (navigator.webdriver) return null;
  if (BOT_UA.test(navigator.userAgent)) return null;
  if (optedOut()) return null;
  return event;
}

export function SiteAnalytics() {
  useEffect(() => {
    try {
      const flag = new URLSearchParams(window.location.search).get("notrack");
      if (flag === "1") window.localStorage.setItem("va-disable", "1");
      else if (flag === "0") window.localStorage.removeItem("va-disable");
    } catch {
      // Storage blocked: nothing to remember.
    }
  }, []);
  return <Analytics beforeSend={beforeSend} />;
}
