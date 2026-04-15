import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Streamlet Player Starter",
  description: "Next.js 16 starter for Streamlet playback experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

