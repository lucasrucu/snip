import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const raw = typeof body?.label === "string" ? body.label.trim() : "";
  const label = raw ? raw.slice(0, 120) : null;

  const { data, error } = await supabase
    .from("links")
    .update({ label })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ link: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  // RLS already restricts deletes to the owner; the user_id filter is belt-and-suspenders.
  const { error } = await supabase
    .from("links")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
