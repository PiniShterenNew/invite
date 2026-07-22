import type { Metadata, Viewport } from "next";
import { Heebo, Frank_Ruhl_Libre } from "next/font/google";
import { t } from "@/lib/i18n/he";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });
const frank = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], variable: "--font-frank" });

export const metadata: Metadata = {
  title: { default: t.common.appName, template: `%s · ${t.common.appName}` },
  description: t.common.tagline,
  // Privacy default: nothing on this product is indexable.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${frank.variable}`}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
