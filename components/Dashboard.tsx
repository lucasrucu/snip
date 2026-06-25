"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { LinksList } from "@/components/LinksList";
import { QoriMark } from "@/components/QoriMark";
import { ShortenForm } from "@/components/ShortenForm";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function Dashboard({ email }: { email: string }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <QoriMark glyph="link" label="Snip" size={28} />
        <div className="flex items-center gap-3">
          {email ? (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {email}
            </span>
          ) : null}
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </div>
      </header>

      <ShortenForm />
      <LinksList />
    </div>
  );
}
