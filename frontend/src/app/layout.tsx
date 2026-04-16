import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Figtree } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Vina Doctor AI Scribe",
  description: "AI-powered medical consultation scribe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", plusJakarta.variable, inter.variable, "font-sans", figtree.variable)}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-surface text-on-surface">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
