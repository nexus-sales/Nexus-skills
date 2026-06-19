'use client'
import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  duration?: number
  onDismiss?: () => void
}

export function Toast({ message, duration = 2200, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, duration)
    return () => window.clearTimeout(timer)
  }, [duration, onDismiss])

  if (!visible || !message) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-accent px-5 py-2 font-mono text-[11px] font-bold text-black shadow-xl"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}
