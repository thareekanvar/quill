import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TranslationProvider } from "@/contexts/translation-context";
import "./globals.css";

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Quill - PostgreSQL Database Admin Tool",
    template: "%s | Quill",
  },
  description: "Quill is a modern, web-based PostgreSQL database administration tool. Browse tables, edit records, run queries, and manage your database with an intuitive interface. Secure, fast, and easy to use.",
  keywords: [
    "PostgreSQL",
    "database admin",
    "database management",
    "PostgreSQL admin",
    "database tool",
    "SQL editor",
    "database browser",
    "PostgreSQL GUI",
    "web-based database",
    "database administration",
  ],
  authors: [{ name: "Quill" }],
  creator: "Quill",
  publisher: "Quill",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Quill - PostgreSQL Database Admin Tool",
    description: "Modern, web-based PostgreSQL database administration tool. Browse tables, edit records, and manage your database with ease.",
    siteName: "Quill",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quill - PostgreSQL Database Admin Tool",
    description: "Modern, web-based PostgreSQL database administration tool. Browse tables, edit records, and manage your database with ease.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TranslationProvider>
            {children}
            <Toaster position="top-right" />
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
