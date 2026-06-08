import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/session";

import { Comparison } from "./_components/Comparison";
import { FeaturesSection } from "./_components/FeaturesSection";
import { FinalCTA } from "./_components/FinalCTA";
import { Hero } from "./_components/Hero";
import { HowItWorks } from "./_components/HowItWorks";
import { ReviewsSection } from "./_components/ReviewsSection";
import { ScrollReveal } from "./_components/ScrollReveal";

export default async function MarketingLandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME);
  const role = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    if (role === "admin") {
      redirect(`/${locale}/admin`);
    } else if (role === "teacher") {
      redirect(`/${locale}/teacher`);
    } else {
      redirect(`/${locale}/reading`);
    }
  }

  return (
    <main>
      <ScrollReveal variant="up">
        <Hero />
      </ScrollReveal>
      <ScrollReveal variant="left" delayMs={40}>
        <HowItWorks />
      </ScrollReveal>
      <ScrollReveal variant="right" delayMs={60}>
        <FeaturesSection />
      </ScrollReveal>
      <ScrollReveal variant="scale" delayMs={80}>
        <ReviewsSection />
      </ScrollReveal>
      <ScrollReveal variant="left" delayMs={100}>
        <Comparison />
      </ScrollReveal>
      <ScrollReveal variant="up" delayMs={120}>
        <FinalCTA />
      </ScrollReveal>
    </main>
  );
}
