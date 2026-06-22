import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Canonical short-link domain shown in the dashboard. Uses NEXT_PUBLIC_SITE_URL
// when set, otherwise defaults to the production domain — so links never render
// as localhost just because the env var is missing or wrong.
export function shortLinkBase(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return "https://qori.click";
}

// Best-effort readable label derived from a URL's path, for when the page gives
// us no title (e.g. Shopee/Tokopedia SPAs). Turns
//   shopee.co.id/Headphone-Wireless-i.123.456  ->  "Headphone Wireless"
// Returns null when the path has nothing human-readable to show.
export function prettyFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let seg = u.pathname.split("/").filter(Boolean).pop() ?? "";
    seg = seg
      .replace(/-i\.\d+\.\d+.*$/i, "") // strip Shopee "-i.shopid.itemid" tail
      .replace(/\.(html?|php|aspx?|jsp)$/i, ""); // strip file extensions
    try {
      seg = decodeURIComponent(seg);
    } catch {
      // leave as-is if it isn't valid encoding
    }
    seg = seg.replace(/[-_+]+/g, " ").replace(/\s+/g, " ").trim();
    // Reject opaque junk (ids, hashes) — require at least one real word.
    if (seg.length < 3 || !/[a-z]{3,}/i.test(seg)) return null;
    if (seg.length > 70) seg = `${seg.slice(0, 70).trim()}…`;
    return seg;
  } catch {
    return null;
  }
}

export function formatRelativeTime(dateString: string | null) {
  if (!dateString) {
    return "Never";
  }

  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
