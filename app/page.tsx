import { Dashboard } from "@/components/Dashboard";
import { FeatureHighlights } from "@/components/landing/FeatureHighlights";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingNav } from "@/components/landing/LandingNav";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main>
        <LandingNav />
        <LandingHero />
        <FeatureHighlights />
        <LandingFooter />
      </main>
    );
  }

  return <Dashboard email={user.email ?? ""} />;
}
