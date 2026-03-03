import Link from "next/link";
import {ArrowRight, Star} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";

import {Container} from "../Container";

type FeaturedStory = {
  name: string;
  city: string;
  initials: string;
  rating: number;
  quote: string;
  band: string;
  date: string;
};

const featuredStories: FeaturedStory[] = [
  {
    name: "Anvar K.",
    city: "Tashkent, Uzbekistan",
    initials: "AK",
    rating: 4,
    quote:
      "The mock tests here are very close to the real exam. I improved from 6.0 to 7.5 in under two months. Highly recommended for Uzbek students aiming for UK universities.",
    band: "BAND 8.0",
    date: "September 2023"
  },
  {
    name: "Madina R.",
    city: "Samarkand, Uzbekistan",
    initials: "MR",
    rating: 5,
    quote:
      "The AI-powered writing evaluation changed my preparation completely. It highlighted grammar and coherence issues I had missed before and helped me get my required score.",
    band: "BAND 7.0",
    date: "October 2023"
  },
  {
    name: "Jasur B.",
    city: "Bukhara, Uzbekistan",
    initials: "JB",
    rating: 5,
    quote:
      "Honestly the best platform for IELTS Academic prep. Reading passages are very diverse and challenging. It really prepares you for the actual pressure on exam day.",
    band: "BAND 8.5",
    date: "August 2023"
  }
];

export function FeaturedStories() {
  const t = useTranslations("reviews");

  return (
    <section className="bg-background py-10 sm:py-12">
      <Container>
        <header className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("sections.featured")}</h2>
          <Link
            href="#"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-500"
          >
            {t("actions.viewAllStories")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featuredStories.map((story) => (
            <Card key={story.name} className="border-border bg-card py-0 shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Avatar className="size-10 border border-border">
                    <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">{story.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{story.name}</p>
                    <p className="text-xs text-muted-foreground">{story.city}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-1" aria-label={`${story.rating} out of 5 stars`}>
                  {Array.from({length: 5}).map((_, index) => (
                    <Star
                      key={index}
                      className={
                        index < story.rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-border"
                      }
                      aria-hidden="true"
                    />
                  ))}
                </div>

                <p className="min-h-28 text-sm leading-relaxed text-muted-foreground">&quot;{story.quote}&quot;</p>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <Badge variant="secondary" className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                    {story.band}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{story.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
