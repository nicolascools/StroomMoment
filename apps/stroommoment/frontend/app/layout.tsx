import "./styles.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "StroomMoment",
  description: "Belgian electricity timing recommendations",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
