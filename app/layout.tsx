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
  title: 'همراه ترابر | پنل مدیریت',
  description: 'پنل مدیریت همراه ترابر',
  icons: {
    icon: '/brand-logo.svg',
    shortcut: '/brand-logo.svg',
    apple: '/brand-logo.svg',
  },
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
