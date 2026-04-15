import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Streamlet Video Upload Starter",
  description: "Next.js 16 starter for video upload and processing with Streamlet.",
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

