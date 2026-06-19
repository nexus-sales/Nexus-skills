'use client'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { Workflow } from '@/types/prompt'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export function useWorkflows() {
  const [customWorkflows, setCustomWorkflows] = useLocalStorage<Workflow[]>('custom_workflows', [])
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      userIdRef.current = user.id
      supabase
        .from('custom_workflows')
        .select('id, name, description, icon, steps, created_at, updated_at')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setCustomWorkflows(data.map(d => ({
              id: d.id,
              name: d.name,
              description: d.description,
              icon: d.icon,
              steps: d.steps,
              isPredefined: false,
              createdAt: d.created_at,
              updatedAt: d.updated_at,
            }) as Workflow))
          }
        })
    })
  }, [setCustomWorkflows])

  const allWorkflows = useMemo(() => customWorkflows, [customWorkflows])

  const create = useCallback((wf: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'isPredefined'>): Workflow => {
    const now = new Date().toISOString()
    const newWf: Workflow = { ...wf, id: `wf_${Date.now()}`, isPredefined: false, createdAt: now, updatedAt: now }
    setCustomWorkflows(prev => [...prev, newWf])
    if (userIdRef.current) {
      supabase.from('custom_workflows').insert({
        id: newWf.id,
        user_id: userIdRef.current,
        name: newWf.name,
        description: newWf.description,
        icon: newWf.icon,
        steps: newWf.steps,
        created_at: now,
        updated_at: now,
      }).then()
    }
    return newWf
  }, [setCustomWorkflows])

  const update = useCallback((id: string, patch: Partial<Workflow>) => {
    const now = new Date().toISOString()
    setCustomWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...patch, updatedAt: now } : w))
    if (userIdRef.current) {
      supabase.from('custom_workflows').update({ ...patch, updated_at: now })
        .eq('id', id).eq('user_id', userIdRef.current).then()
    }
  }, [setCustomWorkflows])

  const remove = useCallback((id: string) => {
    setCustomWorkflows(prev => prev.filter(w => w.id !== id))
    if (userIdRef.current) {
      supabase.from('custom_workflows').delete()
        .eq('id', id).eq('user_id', userIdRef.current).then()
    }
  }, [setCustomWorkflows])

  const getById = useCallback((id: string) => allWorkflows.find(w => w.id === id), [allWorkflows])

  return { allWorkflows, create, update, remove, getById }
}
