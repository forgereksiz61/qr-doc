import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rapor Görüntüleyici",
  description: "Yerel test raporu görüntüleme sayfası.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
