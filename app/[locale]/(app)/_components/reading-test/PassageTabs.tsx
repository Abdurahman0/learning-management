"use client";

import type { ReadingPassage } from "@/data/reading-test-demo";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PassageTabsProps = {
  passages: ReadingPassage[];
  activePassageId: ReadingPassage["id"];
  onPassageChange: (passageId: ReadingPassage["id"]) => void;
};

export function PassageTabs({ passages, activePassageId, onPassageChange }: PassageTabsProps) {
  return (
    <Tabs value={activePassageId} onValueChange={(value) => onPassageChange(value as ReadingPassage["id"])} className="h-full">
      <Card className="h-full gap-0 overflow-hidden rounded-xl border-border py-0">
        <div className="px-5 pt-1">
          <TabsList aria-label="Passage tabs" className="h-12">
            {passages.map((passage) => (
              <TabsTrigger key={passage.id} value={passage.id} aria-label={`Open ${passage.title}`} className="h-12 px-5 text-base">
                {`Passage ${passage.id.slice(1)}`}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {passages.map((passage) => (
          <TabsContent key={passage.id} value={passage.id} className="h-full">
            <ScrollArea className="h-[calc(100vh-15.5rem)] px-6 py-6">
              <CardContent className="mx-auto max-w-4xl space-y-5 px-0 pb-10">
                <p className="text-xs font-semibold tracking-[0.2em] text-blue-700 uppercase">{passage.label}</p>
                <h2 className="text-5xl font-bold tracking-tight text-slate-900">{passage.title}</h2>

                {passage.text.map((paragraph) => (
                  <p key={paragraph} className="max-w-[70ch] text-xl leading-[1.75] text-slate-800">
                    {paragraph}
                  </p>
                ))}
              </CardContent>
            </ScrollArea>
          </TabsContent>
        ))}
      </Card>
    </Tabs>
  );
}
