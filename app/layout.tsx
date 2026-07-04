import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const codeFont = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Node.js Concept Revision",
  description: "Revise Node.js concepts through explanations and hands-on coding challenges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${codeFont.variable} h-full`}>
      <body className="bg-bg text-text flex h-full min-h-screen font-sans antialiased">
        <div className="border-border bg-bg-elevated hidden w-64 shrink-0 border-r md:block">
          <Sidebar />
        </div>
        <main className="min-w-0 flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
      </body>
    </html>
  );
}
