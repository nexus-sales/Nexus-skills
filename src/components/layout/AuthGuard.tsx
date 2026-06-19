'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]" aria-live="polite">
      <div
        className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"
        role="status"
        aria-label="Verificando sesión"
      />
    </div>
  )

  if (!user) return null

  return <>{children}</>
}
