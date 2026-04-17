import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EnglishLabs",
  description: "Practice IELTS Reading and Listening with realistic tests on EnglishLabs.",
  icons: {
    icon: [
      { url: "/brand/englishlabs.svg", type: "image/svg+xml" },
      { url: "/brand/englishlabs.png", type: "image/png" },
    ],
    apple: [{ url: "/brand/englishlabs.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
