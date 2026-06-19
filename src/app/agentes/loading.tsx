export default function Loading() {
  return (
    <div className="max-w-[780px] mx-auto px-5 py-6" aria-live="polite" aria-label="Cargando agentes">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-[#111827] border border-[#1e2d45] rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
