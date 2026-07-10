import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PocketFlow | Personal Finance Dashboard",
  description:
    "Personal finance and budget tracking dashboard developed for PocketFlow.",
  keywords: [
    "finance",
    "dashboard",
    "budget",
    "expenses",
    "saving goals",
    "PocketFlow",
  ],
  authors: [{ name: "PocketFlow Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans bg-background">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}