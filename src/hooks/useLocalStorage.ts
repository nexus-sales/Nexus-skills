'use client'
import { useState, useCallback } from 'react'

export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : fallback
    } catch {
      return fallback
    }
  })

  const set = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      setValue((prev) => {
        const resolved = typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(prev)
          : newValue
        localStorage.setItem(key, JSON.stringify(resolved))
        return resolved
      })
    } catch (e) {
      console.warn(`localStorage write failed for key: ${key}`, e)
    }
  }, [key])

  const remove = useCallback(() => {
    try {
      localStorage.removeItem(key)
      setValue(fallback)
    } catch {/* silent */}
  }, [key, fallback])

  return [value, set, remove] as const
}
