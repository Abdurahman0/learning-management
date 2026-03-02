import { ArrowRight, Play } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Container } from "./Container";

export function Hero() {
  return (
    <section className="py-14 sm:py-16 lg:py-20">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <Badge className="mb-5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase hover:bg-blue-100">
              Updated for 2026 Exam
            </Badge>

            <h1 className="max-w-xl text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-[62px]">
              Practice IELTS Reading & Listening. <span className="text-blue-600">Get Real Scores.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Master the IELTS exam with our comprehensive practice tests and instant AI-powered scoring. Everything you
              need to hit Band 8+.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" className="rounded-lg px-6">
                Start Reading Test
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-lg border-slate-300 bg-white px-6">
                Start Listening Test
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                <Avatar className="size-8 border-2 border-white">
                  <AvatarFallback className="bg-amber-200 text-[10px] font-semibold text-amber-900">AN</AvatarFallback>
                </Avatar>
                <Avatar className="size-8 border-2 border-white">
                  <AvatarFallback className="bg-emerald-200 text-[10px] font-semibold text-emerald-900">LU</AvatarFallback>
                </Avatar>
                <Avatar className="size-8 border-2 border-white">
                  <AvatarFallback className="bg-sky-200 text-[10px] font-semibold text-sky-900">MO</AvatarFallback>
                </Avatar>
              </div>
              <p className="text-sm text-slate-500">Joined by 10,000+ students this month</p>
            </div>
          </div>

          <Card className="overflow-hidden border-slate-200/80 bg-linear-to-br from-emerald-300 via-teal-500 to-cyan-700 p-0 shadow-xl">
            <div className="relative flex min-h-70 items-center justify-center sm:min-h-90">
              <button
                type="button"
                aria-label="Watch demo video"
                className="inline-flex size-16 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105"
              >
                <Play className="size-7 fill-white" aria-hidden="true" />
              </button>

              <span className="absolute top-[58%] text-lg font-semibold text-white drop-shadow-sm">Watch Demo</span>

              <div className="absolute inset-x-10 bottom-3 h-14 rounded-md border border-slate-200/25 bg-slate-700/35 backdrop-blur-sm" />
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
}
