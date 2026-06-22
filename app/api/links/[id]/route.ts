import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";

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
