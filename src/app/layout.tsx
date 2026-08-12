import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeToggle } from "../components/ThemeToggle";

export const metadata: Metadata = {
  title: "Enterprise CRM",
  description: "Enterprise Workforce Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <main>
          {children}
        </main>
        <ThemeToggle />
      </body>
    </html>
  );
}
