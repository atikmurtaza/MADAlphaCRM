import type { Metadata } from "next";

import "./globals.css";
import { ThemeToggle } from "../components/ThemeToggle";

export const metadata: Metadata = {
  title: "Enterprise CRM",
  description: "Enterprise Workforce Management System",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="/theme-init.js" suppressHydrationWarning />
      </head>
      <body>
        <main>
          {children}
        </main>
        <ThemeToggle />
      </body>
    </html>
  );
}
