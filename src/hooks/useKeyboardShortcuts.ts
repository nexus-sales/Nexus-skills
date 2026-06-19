'use client'
import { useEffect } from 'react'

interface Shortcuts {
  onCopy: () => void
  onClear: () => void
}

export function useKeyboardShortcuts({ onCopy, onClear }: Shortcuts) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && (e.key === 'Enter' || (e.shiftKey && e.key === 'C'))) {
        e.preventDefault()
        onCopy()
      }
      if (mod && e.key === 'Backspace' && e.target === document.body) {
        e.preventDefault()
        onClear()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCopy, onClear])
}
