import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SHORT_DOMAIN, SIGN_IN_HREF } from "@/components/landing/constants";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* soft brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-primary/10 blur-3xl"
      />
      <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:py-28">
        <span className="mb-6 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          Shorten · share · track
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Short links, click tracking,{" "}
          <span className="text-primary">yours.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          Snip turns long URLs into clean {SHORT_DOMAIN} links you control —
          pick your own slug, share it anywhere, and watch the clicks roll in
          from one simple dashboard.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={SIGN_IN_HREF}
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-base")}
          >
            Sign in with Google
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="#features"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-6 text-base")}
          >
            See what it does
          </Link>
        </div>

        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
          A personal project — sign in with Google and start shortening in
          seconds. No credit card, no setup.
        </p>
      </div>
    </section>
  );
}
