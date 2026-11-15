import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rapor bulunamadı",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Rapor bulunamadı.</h1>
    </main>
  );
}
