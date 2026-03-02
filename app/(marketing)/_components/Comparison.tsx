import { CheckCircle2, CircleX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Container } from "./Container";

const withoutAccount = [
  "Only 2 practice tests available",
  "No score history tracking",
  "No detailed answer analysis",
  "No personalized recommendations",
] as const;

const withAccount = [
  "Unlimited practice tests",
  "Full score history dashboard",
  "Deep AI analysis of mistakes",
  "Weekly IELTS tips & newsletters",
  "Priority community support",
] as const;

export function Comparison() {
  return (
    <section className="bg-muted/30 py-16 sm:py-20" id="pricing">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-foreground">Maximize Your Preparation</h2>
          <p className="mt-3 text-muted-foreground">See why creating an account is the best choice for your journey.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-2">
          <Card className="hover:scale-105 transition duration-300 border-border bg-card py-0 shadow-sm">
            <CardContent className="px-7 py-8">
              <p className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">Without Account</p>
              <ul className="mt-6 space-y-4" aria-label="Without account limitations">
                {withoutAccount.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <CircleX className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="relative hover:scale-105 transition duration-300 border-blue-600 bg-card py-0 shadow-md">
            <Badge className="absolute top-3 right-3 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] tracking-wide uppercase">
              Recommended
            </Badge>

            <CardContent className="px-7 py-8">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold tracking-[0.16em] text-blue-700 uppercase">With Free Account</p>
                <Badge variant="secondary" className="rounded-full bg-muted text-[10px] text-muted-foreground uppercase">
                  Free Forever
                </Badge>
              </div>

              <ul className="mt-6 space-y-4" aria-label="With free account benefits">
                {withAccount.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Button className="mt-8 w-full rounded-lg" size="lg">
                Create Free Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}
