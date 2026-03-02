import type { ReactNode } from "react";

import { Footer } from "./_components/Footer";
import { Navbar } from "./_components/Navbar";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      {children}
      <hr className="border-border" />
      <Footer />
    </div>
  );
}
