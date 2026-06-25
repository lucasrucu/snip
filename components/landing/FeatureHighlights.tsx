import {
  Link2,
  MousePointerClick,
  Pencil,
  Shield,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Link2,
    title: "Shorten any link",
    description:
      "Paste a long URL and get a clean, shareable short link in one click — ready for chat, email, or print.",
  },
  {
    icon: Pencil,
    title: "Custom slugs",
    description:
      "Pick your own memorable slug instead of a random string, so every link looks intentional.",
  },
  {
    icon: MousePointerClick,
    title: "Track clicks",
    description:
      "See how many times each link was opened and when it was last clicked — no analytics setup required.",
  },
  {
    icon: Shield,
    title: "Own your data",
    description:
      "Your links live in your own Supabase project. No third-party tracker sits between you and your audience.",
  },
];

export function FeatureHighlights() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need to share a link
        </h2>
        <p className="mt-3 text-muted-foreground">
          Fast to create, easy to track, and entirely under your control.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="bg-card">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="size-5" />
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">{description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
