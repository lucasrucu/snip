import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { generateSlug } from "@/lib/slug";

function normalizeUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function GET() {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ links: data ?? [] });
}

export async function POST(request: Request) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const target = normalizeUrl(body?.url);
  if (!target) {
    return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 });
  }

  // Retry a few times in case a generated slug collides with an existing one.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug();
    const { data, error } = await supabase
      .from("links")
      .insert({ slug, target_url: target, user_id: user.id })
      .select()
      .single();

    if (!error) {
      return NextResponse.json({ link: data }, { status: 201 });
    }

    // 23505 = unique_violation → slug already taken, generate another.
    if (error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Could not generate a unique short link. Please try again." },
    { status: 500 }
  );
}
