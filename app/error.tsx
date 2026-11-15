"use client";

export default function ErrorState({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Rapor Görüntüleyici</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Belge şu anda görüntülenemiyor.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Yeniden dene
      </button>
    </main>
  );
}
