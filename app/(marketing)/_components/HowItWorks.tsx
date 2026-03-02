import { CheckSquare, ClipboardList, SearchCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { Container } from "./Container";
import { HOW_IT_WORKS_STEPS } from "./sections";

const icons = [SearchCheck, ClipboardList, CheckSquare] as const;

export function HowItWorks() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-slate-950">How It Works</h2>
          <div className="mx-auto mt-3 h-1 w-14 rounded-full bg-blue-600" />
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const Icon = icons[index];

            return (
              <Card key={step.title} className="hover:scale-105 transition duration-300 border-slate-200 bg-white py-0">
                <CardContent className="px-6 py-8 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
