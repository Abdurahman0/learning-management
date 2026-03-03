import {FeaturedStories} from "../_components/reviews/FeaturedStories";
import {RecentReviews} from "../_components/reviews/RecentReviews";
import {ReviewsCTA} from "../_components/reviews/ReviewsCTA";
import {ReviewsHero} from "../_components/reviews/ReviewsHero";

export default function ReviewsPage() {
  return (
    <main className="bg-background">
      <ReviewsHero />
      <FeaturedStories />
      <RecentReviews />
      <ReviewsCTA />
    </main>
  );
}
