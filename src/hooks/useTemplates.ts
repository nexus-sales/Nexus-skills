'use client'
import { useCallback, useEffect, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { PromptTemplate } from '@/types/prompt'
import { supabase } from '@/lib/supabase'

// Clave unificada con PromptBuilderPage para evitar split-brain (L-01)
const STORAGE_KEY = 'nexus-expert-custom-templates'

function sbRun(query: PromiseLike<{ error: unknown }>, tag: string): void {
  void Promise.resolve(query).then(({ error }) => {
    if (error) console.error(`[${tag}]`, error)
  })
}

export function useTemplates() {
  const [custom, setCustom] = useLocalStorage<Record<string, PromptTemplate>>(STORAGE_KEY, {})
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        userIdRef.current = user.id
        const { data, error } = await supabase
          .from('custom_templates')
          .select('id, name, state, created_at')
          .eq('user_id', user.id)
        if (error) { console.error('[templates:load]', error); return }
        if (!data || data.length === 0) return
        // S-07: merge — local toma prioridad sobre remoto, no sobreescribir
        setCustom(prev => {
          const remote: Record<string, PromptTemplate> = {}
          for (const d of data) {
            remote[d.id] = d.state as PromptTemplate
          }
          return { ...remote, ...prev }
        })
      } catch (err) {
        console.error('[templates:load]', err)
      }
    })()
  }, [setCustom])

  const save = useCallback((name: string, state: PromptTemplate): string => {
    const id = `custom-${Date.now()}`
    const tpl = { ...state, name }
    setCustom(prev => ({ ...prev, [id]: tpl }))
    if (userIdRef.current) {
      sbRun(
        supabase.from('custom_templates').insert({
          id,
          user_id: userIdRef.current,
          name,
          state: tpl,
          created_at: new Date().toISOString(),
        }),
        'templates:save'
      )
    }
    return id
  }, [setCustom])

  const remove = useCallback((id: string) => {
    setCustom(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (userIdRef.current) {
      sbRun(
        supabase.from('custom_templates').delete()
          .eq('id', id).eq('user_id', userIdRef.current),
        'templates:delete'
      )
    }
  }, [setCustom])

  const exportAll = useCallback(() => {
    const data = JSON.stringify(
      { custom_tpls: custom, version: '2.0', export_date: new Date().toISOString() },
      null,
      2
    )
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PromptBuilder_Backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [custom])

  return { custom, save, remove, exportAll }
}
