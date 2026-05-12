import {RecentReviews} from "../_components/reviews/RecentReviews";
import {ReviewsCTA} from "../_components/reviews/ReviewsCTA";
import {ReviewsHero} from "../_components/reviews/ReviewsHero";

export default function ReviewsPage() {
  return (
    <main className="bg-background">
      <ReviewsHero />
      <RecentReviews />
      <ReviewsCTA />
    </main>
  );
}
