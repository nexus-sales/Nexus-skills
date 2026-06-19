'use client'
import { useCallback, useEffect, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { PromptHistory } from '@/types/prompt'
import { supabase } from '@/lib/supabase'

function sbRun(query: PromiseLike<{ error: unknown }>, tag: string): void {
  void Promise.resolve(query).then(({ error }) => {
    if (error) console.error(`[${tag}]`, error)
  })
}

export function useHistory() {
  const [history, setHistory] = useLocalStorage<PromptHistory[]>('nexus-expert-history', [])
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        userIdRef.current = user.id
        const { data, error } = await supabase
          .from('prompt_history')
          .select('id, text, title, date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
        if (error) { console.error('[history:load]', error); return }
        if (!data || data.length === 0) return
        // S-07: merge — local toma prioridad, no sobreescribir
        setHistory(prev => {
          if (prev.length > 0) {
            const localIds = new Set(prev.map(h => h.id))
            const newFromRemote = (data as PromptHistory[]).filter(h => !localIds.has(h.id))
            return [...prev, ...newFromRemote].slice(0, 50)
          }
          return data as PromptHistory[]
        })
      } catch (err) {
        console.error('[history:load]', err)
      }
    })()
  }, [setHistory])

  const add = useCallback((text: string, title: string) => {
    const norm = text.trim().replace(/\s+/g, ' ')
    if (!norm) return
    const entry: PromptHistory = {
      id: Date.now().toString(),
      text,
      title: title.substring(0, 30) || 'Sin título',
      date: new Date().toLocaleTimeString(),
    }
    setHistory(prev => {
      if (prev[0]?.text.trim().replace(/\s+/g, ' ') === norm) return prev
      return [entry, ...prev].slice(0, 50)
    })
    if (userIdRef.current) {
      sbRun(
        supabase.from('prompt_history').insert({
          id: entry.id,
          user_id: userIdRef.current,
          text: entry.text,
          title: entry.title,
          date: entry.date,
        }),
        'history:add'
      )
    }
  }, [setHistory])

  const copyItem = useCallback(async (id: string) => {
    const item = history.find(h => h.id === id)
    if (item) await navigator.clipboard.writeText(item.text)
  }, [history])

  const remove = useCallback((id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id))
    if (userIdRef.current) {
      sbRun(
        supabase.from('prompt_history').delete()
          .eq('id', id).eq('user_id', userIdRef.current),
        'history:delete'
      )
    }
  }, [setHistory])

  const clear = useCallback(() => {
    setHistory([])
    if (userIdRef.current) {
      sbRun(
        supabase.from('prompt_history').delete()
          .eq('user_id', userIdRef.current),
        'history:clear'
      )
    }
  }, [setHistory])

  return { history, add, copyItem, remove, clear }
}
