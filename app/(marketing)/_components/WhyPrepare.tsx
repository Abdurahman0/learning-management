import { CheckCircle2, Clock3, FileSearch2, Sparkles, Zap } from "lucide-react";

import { Card, CardContent, CardTitle } from "@/components/ui/card";

import { Container } from "./Container";

const checklist = ["200+ Practice Tests", "Real Exam Interface", "Mobile Friendly"];

const features = [
  {
    title: "Timed Practice",
    description: "Real-time countdown to help you master time management for each section.",
    icon: Clock3,
  },
  {
    title: "Detailed Explanations",
    description: "Not just answers, but reasoning to help you understand your mistakes.",
    icon: FileSearch2,
  },
  {
    title: "AI Band Predictor",
    description: "Get an estimated band score based on historical data and current trends.",
    icon: Sparkles,
  },
  {
    title: "Weekly Updates",
    description: "New reading passages and listening tracks added every Monday.",
    icon: Zap,
  },
] as const;

export function WhyPrepare() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.35fr]">
          <div>
            <h2 className="max-w-sm text-4xl leading-tight font-bold text-slate-950">Why prepare with this platform?</h2>
            <p className="mt-5 max-w-md text-slate-600">
              We provide a professional ecosystem designed specifically for serious candidates who want to ensure their
              success.
            </p>

            <ul className="mt-7 space-y-3" aria-label="Platform benefits">
              {checklist.map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:scale-105 transition duration-300 border-slate-200 bg-white py-0">
                <CardContent className="space-y-3 px-6 py-6">
                  <feature.icon className="size-5 text-blue-600" aria-hidden="true" />
                  <CardTitle className="text-lg text-slate-900">{feature.title}</CardTitle>
                  <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
