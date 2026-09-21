import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AppToastProvider } from "@/components/AppToastProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlgoNoteHelper",
  description: "Your searchable algorithm practice notes",
  icons: {
    icon: [
      { url: "/brand/algonote-icon.svg", type: "image/svg+xml" },
      { url: "/brand/algonote-icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/brand/algonote-icon-32.png",
    apple: [
      {
        url: "/brand/algonote-apple-touch.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme="dark"
    >
      <body className="flex min-h-full flex-col bg-canvas text-foreground font-sans">
        <NextIntlClientProvider messages={messages}>
          <AppToastProvider />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
