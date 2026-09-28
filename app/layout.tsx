import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import ThemeProviderClient from "./providers/ThemeProvider";
import AuthGuard from "./components/auth/AuthGuard";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "پنل مدیریت",
  description: "پنل مدیریت حمراهatraabar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <ThemeProviderClient>
          <AuthGuard>
            {children}
          </AuthGuard>
        </ThemeProviderClient>
      </body>
    </html>
  );
}
