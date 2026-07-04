import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import PageTransition from "@/components/PageTransition";
import VisitTracker from "@/components/VisitTracker";
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

const themeInitScript = `
try {
  var theme = localStorage.getItem("theme");
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${codeFont.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="bg-bg text-text min-h-screen font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <VisitTracker />
        <MobileNav />
        <div className="border-border bg-bg-elevated fixed inset-y-0 left-0 hidden w-64 border-r md:block">
          <Sidebar />
        </div>
        <main className="min-w-0 md:ml-64">
          <PageTransition>{children}</PageTransition>
        </main>
      </body>
    </html>
  );
}
