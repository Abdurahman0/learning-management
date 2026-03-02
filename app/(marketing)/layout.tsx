import type { ReactNode } from "react";

import { Footer } from "./_components/Footer";
import { Navbar } from "./_components/Navbar";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <Navbar />
      {children}
      <hr />
      <Footer />
    </div>
  );
}