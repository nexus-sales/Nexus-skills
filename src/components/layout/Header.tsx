'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { TargetModel } from '@/types/prompt'
import { HelpCircle, X, Check, Info, Brain, Zap, Shield, Skull, LogIn, LogOut, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  model: TargetModel
  onModelChange: (model: TargetModel) => void
  onThemeToggle: () => void
  onClear: () => void
}

const NAV_LINKS = [
  { href: '/', label: 'Nexus', active: (pathname: string) => pathname === '/' || pathname.startsWith('/nexus'), tone: 'accent' },
  { href: '/prompt-builder', label: 'Modo avanzado', active: (pathname: string) => pathname.startsWith('/prompt-builder'), tone: 'blue' },
  { href: '/agentes', label: 'Agentes', active: (pathname: string) => pathname.startsWith('/agentes'), tone: 'blue' },
  { href: '/skills', label: 'Skills', active: (pathname: string) => pathname.startsWith('/skills'), tone: 'purple' },
  { href: '/workflows', label: 'Workflows', active: (pathname: string) => pathname.startsWith('/workflows'), tone: 'orange' },
]

function activeClass(tone: string): string {
  if (tone === 'blue') return 'bg-accent-blue/10 text-accent-blue'
  if (tone === 'purple') return 'bg-accent-purple/10 text-accent-purple'
  if (tone === 'orange') return 'bg-orange-400/10 text-orange-400'
  return 'bg-accent/10 text-accent'
}

export const Header = ({ model, onModelChange, onThemeToggle, onClear }: HeaderProps) => {
  const [showHelp, setShowHelp] = useState(false)
  const pathname = usePathname()
  const { user, loading: authLoading, profile, signOut } = useAuth()

  return (
    <header className="bg-surface3 border-b border-border py-5 px-6 sticky top-0 z-50 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="logo-dot" />
            <span className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
              Nexus - Sistemas IA
            </span>
          </div>
          <nav className="flex items-center gap-1" aria-label="Navegacion principal">
            {NAV_LINKS.map((link) => {
              const isActive = link.active(pathname)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${isActive ? activeClass(link.tone) : 'text-muted hover:text-text'}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-2 items-center">
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value as TargetModel)}
              aria-label="Seleccionar modelo de IA objetivo"
              title="Seleccionar modelo de IA objetivo"
              className="bg-surface2 border border-border text-text h-8 px-2.5 rounded-lg font-mono text-[10px] outline-none focus:border-accent-blue transition-all"
            >
              <option value="universal">UNIVERSAL</option>
              <option value="claude">CLAUDE (Anthropic)</option>
              <option value="gemini">GEMINI (Google)</option>
              <option value="gpt4">GPT-4 (OpenAI)</option>
              <option value="deepseek">DEEPSEEK (Reasoning)</option>
            </select>

            <button
              type="button"
              onClick={() => setShowHelp(true)}
              title="Guia completa de uso"
              aria-label="Abrir guia completa de uso"
              className="w-8 h-8 flex items-center justify-center bg-surface2 border border-border rounded-lg hover:border-accent-blue text-accent-blue transition-all"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onThemeToggle}
              className="w-8 h-8 flex items-center justify-center bg-surface2 border border-border rounded-lg hover:border-accent-blue transition-all"
              aria-label="Cambiar tema"
            >
              ◐
            </button>
            <button
              type="button"
              onClick={onClear}
              className="w-8 h-8 flex items-center justify-center bg-surface2 border border-border rounded-lg hover:border-accent-blue transition-all"
              aria-label="Limpiar formulario"
            >
              ×
            </button>
          </div>

          <span className="hidden sm:inline-flex bg-accent-purple/10 border border-accent-purple/25 text-accent-purple font-mono text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
            Ideas a sistemas IA
          </span>
          <span className="hidden sm:inline-flex bg-accent-blue/10 border border-accent-blue/25 text-accent-blue font-mono text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
            Prompt Builder avanzado
          </span>

          {!authLoading && (
            user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] text-muted" title={user.email ?? ''}>
                  <User className="w-3 h-3" />
                  {profile?.nombre ?? user.email?.split('@')[0]}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  className="w-8 h-8 flex items-center justify-center bg-surface2 border border-border rounded-lg hover:border-red-400/50 hover:text-red-400 text-muted transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 h-8 px-3 bg-surface2 border border-border rounded-lg hover:border-accent-blue text-muted hover:text-accent-blue transition-all font-mono text-[10px] uppercase tracking-wider"
                aria-label="Iniciar sesión"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )
          )}
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-blue/10 rounded-lg">
                  <Brain className="w-5 h-5 text-accent-blue" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text">Guía Maestra de Nexus</h2>
                  <p className="text-xs text-muted">Prompts, skills, agentes y workflows desde una idea</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-surface2 rounded-lg transition-colors"
                aria-label="Cerrar ayuda"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-accent-blue font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Flujo Nexus
                  </h3>
                  <p className="text-sm text-label leading-relaxed">
                    Nexus convierte una idea inicial en un sistema de IA reutilizable: análisis, prompt recomendado,
                    skill, workflow, agente sugerido, sistema final y resultado esperado.
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-accent-purple font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Modo avanzado
                  </h3>
                  <p className="text-sm text-label leading-relaxed">
                    El Prompt Builder sigue disponible como editor experto para ajustar modelos, técnicas,
                    restricciones, evidencia y formato antes de ejecutar tus prompts.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-text font-bold text-md border-b border-border pb-2">Estructura de trabajo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: '01', title: 'Idea', desc: 'Describe qué quieres crear con lenguaje natural.' },
                    { id: '02', title: 'Sistema', desc: 'Nexus genera prompts, skills, agentes y workflows desde esa idea.' },
                    { id: '03', title: 'Revisión', desc: 'Edita los artefactos antes de copiarlos o exportarlos.' },
                    { id: '04', title: 'Modo avanzado', desc: 'Usa el builder clásico cuando necesites control campo por campo.' },
                  ].map((block) => (
                    <div key={block.id} className="p-4 bg-surface2 border border-border rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono bg-accent/10 text-accent px-1.5 py-0.5 rounded border border-accent/20">{block.id}</span>
                        <h4 className="text-sm font-bold text-text">{block.title}</h4>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">{block.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-text font-bold text-md border-b border-border pb-2">Atajos de teclado</h3>
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-2 bg-surface2 px-3 py-2 rounded-lg border border-border">
                    <Check className="w-3.5 h-3.5 text-accent" />
                    <span><kbd className="font-mono font-bold bg-surface px-1 rounded border border-border">Ctrl</kbd> + <kbd className="font-mono font-bold bg-surface px-1 rounded border border-border">Enter</kbd> Copiar prompt generado</span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface2 px-3 py-2 rounded-lg border border-border">
                    <Info className="w-3.5 h-3.5 text-accent-blue" />
                    <span>El icono de ayuda abre contexto sobre cada bloque.</span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface2 px-3 py-2 rounded-lg border border-border">
                    <Skull className="w-3.5 h-3.5 text-red-400" />
                    <span>Modo Diablo: revisión crítica para endurecer resultados.</span>
                  </div>
                </div>
              </div>

              <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4">
                <p className="text-xs text-accent-blue font-syne italic text-center">
                  “Una idea útil se vuelve más potente cuando puede repetirse como sistema.”
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-border bg-white/[0.02] flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="px-6 py-2 bg-accent-blue text-white rounded-xl text-sm font-bold hover:bg-accent-blue/90 transition-all shadow-lg shadow-accent-blue/20"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
