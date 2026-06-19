'use client'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { Agent } from '@/types/prompt'
import { PREDEFINED_AGENTS } from '@/constants/agents'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

function sbRun(query: PromiseLike<{ error: unknown }>, tag: string): void {
  void Promise.resolve(query).then(({ error }) => {
    if (error) console.error(`[${tag}]`, error)
  })
}

export function useAgents() {
  const [customAgents, setCustomAgents] = useLocalStorage<Agent[]>('custom_agents', [])
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        userIdRef.current = user.id
        const { data, error } = await supabase
          .from('custom_agents')
          .select('data')
          .eq('user_id', user.id)
        if (error) { console.error('[agents:load]', error); return }
        if (!data || data.length === 0) return
        // S-07: merge — local toma prioridad sobre remoto
        setCustomAgents(prev => {
          if (prev.length > 0) {
            const localIds = new Set(prev.map(a => a.id))
            const newFromRemote = (data as { data: Agent }[])
              .map(d => d.data)
              .filter(a => !localIds.has(a.id))
            return [...prev, ...newFromRemote]
          }
          return (data as { data: Agent }[]).map(d => d.data)
        })
      } catch (err) {
        console.error('[agents:load]', err)
      }
    })()
  }, [setCustomAgents])

  const allAgents = useMemo(
    () => [...PREDEFINED_AGENTS, ...customAgents],
    [customAgents]
  )

  const create = useCallback((
    agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'isCustom'>
  ): Agent => {
    const newAgent: Agent = {
      ...agent,
      id: `agent_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true,
    }
    setCustomAgents(prev => [...prev, newAgent])
    if (userIdRef.current) {
      sbRun(
        supabase.from('custom_agents').insert({
          id: newAgent.id,
          user_id: userIdRef.current,
          data: newAgent,
          created_at: newAgent.createdAt,
          updated_at: newAgent.updatedAt,
        }),
        'agents:create'
      )
    }
    return newAgent
  }, [setCustomAgents])

  const update = useCallback((id: string, patch: Partial<Agent>) => {
    const updatedAt = new Date().toISOString()
    // L-05: actualizar directamente en local sin re-leer de Supabase (elimina race condition)
    setCustomAgents(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, ...patch, updatedAt } : a)
      if (userIdRef.current) {
        const target = updated.find(a => a.id === id)
        if (target) {
          sbRun(
            supabase.from('custom_agents')
              .update({ data: target, updated_at: updatedAt })
              .eq('id', id)
              .eq('user_id', userIdRef.current!),
            'agents:update'
          )
        }
      }
      return updated
    })
  }, [setCustomAgents])

  const remove = useCallback((id: string) => {
    setCustomAgents(prev => prev.filter(a => a.id !== id))
    if (userIdRef.current) {
      sbRun(
        supabase.from('custom_agents').delete()
          .eq('id', id).eq('user_id', userIdRef.current),
        'agents:delete'
      )
    }
  }, [setCustomAgents])

  const getById = useCallback(
    (id: string) => allAgents.find(a => a.id === id),
    [allAgents]
  )

  return { allAgents, customAgents, create, update, remove, getById }
}
