export default function SkillsLoading() {
  return (
    <div className="max-w-[780px] mx-auto px-5 py-6" aria-live="polite" aria-label="Cargando skills">
      <div className="h-8 w-48 bg-surface2 rounded-xl animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 bg-surface border border-border rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
