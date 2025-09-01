'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { StaffMember } from '@/lib/types'
import { useMockStaff } from './useMockStaff'

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export function useStaff() {
  const mockStaff = useMockStaff()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // モックモードの場合はモックフックを使用
  if (isMockMode) {
    return mockStaff
  }

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setStaff(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addStaff = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .insert({ name })
        .select()
        .single()

      if (error) throw error
      setStaff(prev => [...prev, data])
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const updateStaff = async (id: string, name: string) => {
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .update({ name })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setStaff(prev => prev.map(s => s.id === id ? data : s))
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const deleteStaff = async (id: string) => {
    try {
      const { error } = await supabase
        .from('staff_members')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      setStaff(prev => prev.filter(s => s.id !== id))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  useEffect(() => {
    fetchStaff()

    const channel = supabase
      .channel('staff_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'staff_members' },
        () => {
          fetchStaff()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    staff,
    loading,
    error,
    addStaff,
    updateStaff,
    deleteStaff,
    refetch: fetchStaff
  }
}