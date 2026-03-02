import { BookOpenText, Clock3, LineChart, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { Container } from "./Container";

const features = [
  {
    title: "Authentic Interface",
    description: "Mirror the real IELTS computer-delivered layout to reduce surprise on exam day.",
    icon: BookOpenText,
  },
  {
    title: "Timed Practice",
    description: "Train under section-based countdowns and learn exam pacing that actually works.",
    icon: Clock3,
  },
  {
    title: "Instant Scoring",
    description: "Receive fast, structured feedback right after submission for faster improvement loops.",
    icon: Sparkles,
  },
  {
    title: "Progress Tracking",
    description: "Track accuracy trends, weak areas, and test history after registration.",
    icon: LineChart,
  },
] as const;

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-24 bg-muted/30 py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="mb-4 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
          >
            Platform Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Features</h2>
          <p className="mt-3 text-muted-foreground sm:text-lg">
            Built for authentic IELTS Reading and Listening preparation with exam-focused workflows.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border bg-card py-0 shadow-sm hover:scale-105 transition duration-300">
              <CardContent className="p-6 sm:p-7">
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <feature.icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-dashed border-border bg-muted/30 py-0 shadow-sm">
          <CardContent className="flex flex-col items-start gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground sm:text-base">
              Writing and Speaking modules are planned next to complete full IELTS coverage.
            </p>
            <Badge variant="outline" className="rounded-full border-border bg-muted text-muted-foreground">
              Coming soon
            </Badge>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
