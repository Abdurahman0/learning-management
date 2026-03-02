import { Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { Container } from "./Container";

const reviews = [
  {
    name: "Dilshod Karimov",
    location: "Tashkent, Uzbekistan",
    initials: "DK",
    rating: 5,
    text: "Reading practice felt structured and realistic. I improved my time control in just a few mock attempts.",
  },
  {
    name: "Madina Ismoilova",
    location: "Samarkand, Uzbekistan",
    initials: "MI",
    rating: 5,
    text: "Listening sessions with countdowns helped me stay calm under pressure. My score became much more stable.",
  },
  {
    name: "Rustam Gafurov",
    location: "Bukhara, Uzbekistan",
    initials: "RG",
    rating: 4,
    text: "The interface is clean and close to the real exam format. Feedback after each attempt is very practical.",
  },
  {
    name: "Shahnoza Tursunova",
    location: "Namangan, Uzbekistan",
    initials: "ST",
    rating: 5,
    text: "Progress tracking showed exactly which question types were slowing me down. It made my preparation focused.",
  },
  {
    name: "Azizbek Rakhimov",
    location: "Andijan, Uzbekistan",
    initials: "AR",
    rating: 5,
    text: "The mock tests are consistent and professional. I now follow a daily routine without wasting time.",
  },
  {
    name: "Akmaljon Rasulov",
    location: "Fergana, Uzbekistan",
    initials: "AR",
    rating: 4,
    text: "I liked the balanced mix of Reading and Listening tasks. It helped me prepare steadily every week.",
  },
] as const;

export function ReviewsSection() {
  return (
    <section id="reviews" className="scroll-mt-24 bg-muted/30 py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100">
            Learner Feedback
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Reviews</h2>
          <p className="mt-3 text-muted-foreground sm:text-lg">
            Trusted by learners preparing for IELTS in Uzbekistan.
          </p>
        </div>

        <div className="reviews-marquee mt-10 overflow-hidden">
          <div className="reviews-track flex w-max">
            {[0, 1].map((copyIndex) => (
              <ul key={copyIndex} className="flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5" aria-hidden={copyIndex === 1}>
                {reviews.map((review) => (
                  <li key={`${copyIndex}-${review.name}-${review.location}`}>
                    <Card
                      tabIndex={0}
                      className="w-[320px] border-border bg-card py-0 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-[350px]"
                    >
                      <CardContent className="p-5">
                        <div className="mb-4 flex items-center gap-3">
                          <Avatar className="size-10">
                            <AvatarFallback className="bg-blue-100 font-semibold text-blue-700">
                              {review.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{review.name}</p>
                            <p className="text-xs text-muted-foreground">{review.location}</p>
                          </div>
                        </div>

                        <div className="mb-3 flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={
                                index < review.rating
                                  ? "size-4 fill-amber-400 text-amber-400"
                                  : "size-4 text-border"
                              }
                              aria-hidden="true"
                            />
                          ))}
                        </div>

                        <p className="text-sm leading-relaxed text-muted-foreground">{review.text}</p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
