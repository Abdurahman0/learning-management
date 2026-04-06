import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/session";

import { Comparison } from "./_components/Comparison";
import { FeaturesSection } from "./_components/FeaturesSection";
import { FinalCTA } from "./_components/FinalCTA";
import { Hero } from "./_components/Hero";
import { HowItWorks } from "./_components/HowItWorks";
import { ReviewsSection } from "./_components/ReviewsSection";

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
      <Hero />
      <HowItWorks />
      <FeaturesSection />
      <ReviewsSection />
      <Comparison />
      <FinalCTA />
    </main>
  );
}
