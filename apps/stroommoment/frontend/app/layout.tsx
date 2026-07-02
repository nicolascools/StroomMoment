import "./styles.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

const title = "StroomMoment - When should I use electricity?";
const description = "A Belgian energy timing PoC that recommends better windows to run appliances using Belgian load, PV/wind forecasts, and day-ahead price signals.";
const publicUrl = "https://poc.coolsnet.com";

export const metadata: Metadata = {
  metadataBase: new URL(publicUrl),
  title,
  description,
  applicationName: "StroomMoment",
  alternates: {
    canonical: publicUrl,
  },
  openGraph: {
    title,
    description,
    url: publicUrl,
    siteName: "StroomMoment",
    locale: "en_BE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1f7a4f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
