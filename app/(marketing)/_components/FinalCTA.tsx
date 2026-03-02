import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Container } from "./Container";

export function FinalCTA() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Card className="overflow-hidden border-0 bg-linear-to-r from-slate-950 via-slate-900 to-blue-950 py-0 text-white shadow-xl">
          <CardContent className="px-6 py-14 text-center sm:px-10">
            <h2 className="text-3xl font-bold sm:text-5xl">Ready to reach your target band?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-200 sm:text-lg">
              Stop guessing. Start practicing with the platform that mirrors the real IELTS experience. No credit card
              required to start.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="rounded-lg px-8">
                Get Started for Free
              </Button>
              <Button size="lg" variant="secondary" className="rounded-lg bg-white px-8 text-slate-900 hover:bg-slate-100">
                View Practice Tests
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}