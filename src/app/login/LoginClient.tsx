'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function LoginClient() {
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message === 'Invalid login credentials'
            ? 'Email o contraseña incorrectos.'
            : error.message)
        } else {
          router.push('/')
          router.refresh()
        }
      } else {
        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setSuccess('Cuenta creada. Revisa tu email para confirmar el registro.')
        }
      }
    } catch {
      setError('No se pudo conectar con Supabase. Revisa las variables de entorno o la conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-2 h-2 rounded-full bg-accent mx-auto mb-4" />
          <span className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            Nexus - Sistemas IA
          </span>
        </div>

        <div className="bg-surface2 border border-border rounded-2xl p-6 shadow-xl">
          <h1 className="text-lg font-bold text-text mb-1">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>
          <p className="text-xs text-muted mb-6">
            {mode === 'login'
              ? 'Accede a tus prompts y plantillas guardados en la nube.'
              : 'Guarda tus prompts y plantillas en la nube de forma segura.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-accent-blue transition-colors placeholder:text-muted/50"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-accent-blue transition-colors placeholder:text-muted/50"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p role="status" className="text-xs text-accent bg-accent/10 border border-accent/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-blue text-white rounded-xl py-2.5 text-sm font-bold hover:bg-accent-blue/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Procesando...'
                : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode((currentMode) => currentMode === 'login' ? 'register' : 'login')
              setError(null)
              setSuccess(null)
            }}
            className="mt-4 w-full text-center text-xs text-muted hover:text-text transition-colors"
            aria-label={mode === 'login' ? 'Cambiar a crear cuenta' : 'Cambiar a iniciar sesión'}
          >
            {mode === 'login'
              ? '¿No tienes cuenta? Créala gratis'
              : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
