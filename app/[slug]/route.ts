import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Public redirect — no auth required. Anyone with the short link is sent to the
// target. resolve_link is a SECURITY DEFINER function: it atomically increments
// click_count and returns the target_url, bypassing RLS for this read only.
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const supabase = await createClient();

  const { data: targetUrl, error } = await supabase.rpc("resolve_link", {
    p_slug: slug,
  });

  if (error || !targetUrl) {
    // Unknown slug → send them to the app home rather than a dead end.
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.redirect(targetUrl as string, 302);
}
