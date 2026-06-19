'use client'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { Skill } from '@/types/prompt'
import { PREDEFINED_SKILLS } from '@/constants/skills'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export function useSkills() {
  const [customSkills, setCustomSkills] = useLocalStorage<Skill[]>('custom_skills', [])
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      userIdRef.current = user.id
      supabase
        .from('custom_skills')
        .select('id, name, description, icon, category, content, insert_target, is_exportable, created_at, updated_at')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setCustomSkills(data.map(d => ({
              id: d.id,
              name: d.name,
              description: d.description,
              icon: d.icon,
              category: d.category,
              content: d.content,
              insertTarget: d.insert_target,
              isExportable: d.is_exportable,
              isPredefined: false,
              createdAt: d.created_at,
              updatedAt: d.updated_at,
            }) as Skill))
          }
        })
    })
  }, [setCustomSkills])

  const allSkills = useMemo(
    () => [...PREDEFINED_SKILLS, ...customSkills],
    [customSkills]
  )

  const create = useCallback((skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'isPredefined'>): Skill => {
    const now = new Date().toISOString()
    const newSkill: Skill = { ...skill, id: `skill_${Date.now()}`, isPredefined: false, createdAt: now, updatedAt: now }
    setCustomSkills(prev => [...prev, newSkill])
    if (userIdRef.current) {
      supabase.from('custom_skills').insert({
        id: newSkill.id,
        user_id: userIdRef.current,
        name: newSkill.name,
        description: newSkill.description,
        icon: newSkill.icon,
        category: newSkill.category,
        content: newSkill.content,
        insert_target: newSkill.insertTarget,
        is_exportable: newSkill.isExportable,
        created_at: now,
        updated_at: now,
      }).then()
    }
    return newSkill
  }, [setCustomSkills])

  const update = useCallback((id: string, patch: Partial<Skill>) => {
    const now = new Date().toISOString()
    setCustomSkills(prev => prev.map(s => s.id === id ? { ...s, ...patch, updatedAt: now } : s))
    if (userIdRef.current) {
      const dbPatch: Record<string, unknown> = { updated_at: now }
      if (patch.name !== undefined) dbPatch.name = patch.name
      if (patch.description !== undefined) dbPatch.description = patch.description
      if (patch.icon !== undefined) dbPatch.icon = patch.icon
      if (patch.category !== undefined) dbPatch.category = patch.category
      if (patch.content !== undefined) dbPatch.content = patch.content
      if (patch.insertTarget !== undefined) dbPatch.insert_target = patch.insertTarget
      if (patch.isExportable !== undefined) dbPatch.is_exportable = patch.isExportable
      supabase.from('custom_skills').update(dbPatch)
        .eq('id', id).eq('user_id', userIdRef.current).then()
    }
  }, [setCustomSkills])

  const remove = useCallback((id: string) => {
    setCustomSkills(prev => prev.filter(s => s.id !== id))
    if (userIdRef.current) {
      supabase.from('custom_skills').delete()
        .eq('id', id).eq('user_id', userIdRef.current).then()
    }
  }, [setCustomSkills])

  const exportAsInstructions = useCallback((skill: Skill) => {
    const content = `---
description: ${skill.description}
---

# ${skill.name}

${skill.content}
`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${skill.name.toLowerCase().replace(/\s+/g, '-')}.instructions.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const getById = useCallback((id: string) => allSkills.find(s => s.id === id), [allSkills])

  return { allSkills, customSkills, create, update, remove, exportAsInstructions, getById }
}
