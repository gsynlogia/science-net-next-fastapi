import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Science Net",
  description: "Portal społecznościowy dla ludzi nauki",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
