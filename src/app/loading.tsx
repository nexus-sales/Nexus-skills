export default function Loading() {
  return (
    <div
      className="flex items-center justify-center min-h-[60vh]"
      aria-live="polite"
      aria-label="Cargando"
    >
      <div
        className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"
        role="status"
        aria-label="Cargando página"
      />
    </div>
  )
}
