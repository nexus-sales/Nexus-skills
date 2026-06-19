'use client'
import { useState } from 'react'
import { Download, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { exportPrompt, EXPORT_OPTIONS, type ExportFormat } from '@/lib/export-formats'
import type { PromptFormState, TargetModel } from '@/types/prompt'

interface ExportMenuProps {
  state: PromptFormState
  model?: TargetModel
}

export function ExportMenu({ state, model = 'universal' }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [copiedFormat, setCopiedFormat] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    const exported = exportPrompt(state, format, model)

    if (format === 'claude_code') {
      const blob = new Blob([exported], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'CLAUDE.md'
      a.click()
      URL.revokeObjectURL(url)
    } else {
      await navigator.clipboard.writeText(exported)
    }

    setCopiedFormat(format)
    setOpen(false)
    setTimeout(() => setCopiedFormat(null), 2500)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] text-muted bg-surface2 border border-border rounded-lg hover:border-accent-blue/40 transition-colors uppercase tracking-wider"
        aria-label={`Opciones de exportación del prompt${open ? ' (abierto)' : ''}`}
        aria-haspopup="true"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        EXPORTAR
        {open
          ? <ChevronUp className="w-3 h-3 transition-transform" aria-hidden="true" />
          : <ChevronDown className="w-3 h-3 transition-transform" aria-hidden="true" />}
      </button>

      {open && (
        <>
          {/* Click-outside overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <div
            className="absolute right-0 top-full mt-2 w-72 bg-surface3 border border-border rounded-xl shadow-2xl z-20 overflow-hidden"
            role="menu"
            aria-label="Formatos de exportación disponibles"
          >
            {EXPORT_OPTIONS.map(opt => (
              <button
                key={opt.format}
                type="button"
                onClick={() => handleExport(opt.format)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface2 transition-colors text-left"
                role="menuitem"
                aria-label={`Exportar como ${opt.label}: ${opt.description}`}
              >
                <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text">{opt.label}</p>
                  <p className="text-[10px] text-muted mt-0.5">{opt.description}</p>
                </div>
                {copiedFormat === opt.format && (
                  <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" aria-label="Exportado" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
