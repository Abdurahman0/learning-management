import { Comparison } from "./_components/Comparison";
import { FeaturesSection } from "./_components/FeaturesSection";
import { FinalCTA } from "./_components/FinalCTA";
import { Hero } from "./_components/Hero";
import { HowItWorks } from "./_components/HowItWorks";
import { ReviewsSection } from "./_components/ReviewsSection";

export default function MarketingLandingPage() {
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
