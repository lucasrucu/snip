import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

type PreviewData = {
  title: string | null;
  image: string | null;
  favicon: string;
  domain: string;
};

// Soft in-instance cache so repeat views don't refetch the same page.
const CACHE = new Map<string, { data: PreviewData; at: number }>();
const TTL = 1000 * 60 * 60; // 1 hour

// Basic SSRF guard — only allow public http(s) targets.
function isPublicHttpUrl(u: URL): boolean {
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    return false;
  }
  return true;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function firstMatch(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decodeEntities(m[1]);
  }
  return null;
}

export async function GET(request: Request) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (!isPublicHttpUrl(target)) {
    return NextResponse.json({ error: "Unsupported url" }, { status: 400 });
  }

  const key = target.toString();
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.at < TTL) {
    return NextResponse.json(cached.data, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  }

  const domain = target.hostname.replace(/^www\./, "");
  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  // Screenshot fallback — free, keyless. Used only when the page has no og:image.
  const screenshot = `https://s0.wp.com/mshots/v1/${encodeURIComponent(key)}?w=640&h=400`;

  let title: string | null = null;
  let image: string | null = null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(key, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; snip-link-preview/1.0; +https://links.qori.land)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);

    const contentType = res.headers.get("content-type") ?? "";
    if (res.ok && contentType.includes("text/html")) {
      // Only read enough to cover <head> (meta tags), capped to avoid huge pages.
      let html = "";
      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let received = 0;
        while (received < 200_000) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value.byteLength;
          html += decoder.decode(value, { stream: true });
          if (/<\/head>/i.test(html)) break;
        }
        await reader.cancel().catch(() => {});
      } else {
        html = await res.text();
      }

      title = firstMatch(html, [
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
        /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
        /<title[^>]*>([^<]+)<\/title>/i,
      ]);

      const ogImage = firstMatch(html, [
        /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
        /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      ]);

      if (ogImage) {
        try {
          image = new URL(ogImage, key).toString();
        } catch {
          image = null;
        }
      }
    }
  } catch {
    // Network/parse failure — fall through to screenshot + favicon.
  }

  if (!image) {
    image = screenshot;
  }

  const data: PreviewData = { title, image, favicon, domain };
  CACHE.set(key, { data, at: Date.now() });

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
