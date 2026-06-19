'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="max-w-[780px] mx-auto px-5 py-6" role="alert">
      <h2 className="text-[#ef4444] font-bold">Algo salió mal</h2>
      <p className="text-[#5a7090] text-sm mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 text-[#0099ff] text-sm hover:underline"
        aria-label="Reintentar operación"
      >
        Reintentar
      </button>
    </div>
  );
}
