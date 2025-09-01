'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { StaffMember } from '@/lib/types'
import { mockStaff } from '@/lib/mockData'
import { useUnifiedAuth } from './useUnifiedAuth'

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export function useUnifiedStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useUnifiedAuth()

  // ログインユーザーを自動的にスタッフとして追加
  const ensureCurrentUserInStaff = async () => {
    if (!user) return

    const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || user?.email

    if (isMockMode) {
      const storedStaff = localStorage.getItem('mock_staff')
      const currentStaff: StaffMember[] = storedStaff ? JSON.parse(storedStaff) : [...mockStaff]
      
      // 現在のユーザーがスタッフリストに存在するかチェック
      const userExists = currentStaff.some(s => s.name === userName || s.email === user.email)
      
      if (!userExists) {
        const newStaff: StaffMember = {
          id: user.id || Date.now().toString(),
          name: userName,
          email: user.email,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        currentStaff.unshift(newStaff) // 先頭に追加
        localStorage.setItem('mock_staff', JSON.stringify(currentStaff))
        setStaff(currentStaff)
      } else {
        setStaff(currentStaff)
      }
    } else {
      // 実際のSupabase
      try {
        // まず現在のユーザーがスタッフテーブルに存在するかチェック
        const { data: existingStaff } = await supabase
          .from('staff_members')
          .select('*')
          .or(`name.eq.${userName},email.eq.${user.email}`)
          .eq('is_active', true)
          .single()

        if (!existingStaff) {
          // 存在しない場合は自動追加
          await supabase
            .from('staff_members')
            .insert({
              name: userName,
              email: user.email,
              user_id: user.id
            })
        }
        
        await fetchStaff()
      } catch (error) {
        console.error('Error ensuring user in staff:', error)
        await fetchStaff()
      }
    }
  }

  useEffect(() => {
    if (isMockMode) {
      const storedStaff = localStorage.getItem('mock_staff')
      if (storedStaff) {
        setStaff(JSON.parse(storedStaff))
      } else {
        setStaff(mockStaff)
        localStorage.setItem('mock_staff', JSON.stringify(mockStaff))
      }
      setLoading(false)
    } else {
      fetchStaff()
    }
  }, [])

  // ユーザーがログインしたときに自動的にスタッフに追加
  useEffect(() => {
    if (user && !loading) {
      ensureCurrentUserInStaff()
    }
  }, [user])

  const fetchStaff = async () => {
    if (isMockMode) return

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
    if (isMockMode) {
      const newStaff: StaffMember = {
        id: Date.now().toString(),
        name,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const updatedStaff = [...staff, newStaff]
      setStaff(updatedStaff)
      localStorage.setItem('mock_staff', JSON.stringify(updatedStaff))
      
      return { data: newStaff, error: null }
    } else {
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
  }

  const updateStaff = async (id: string, name: string) => {
    if (isMockMode) {
      const updatedStaff = staff.map(s => 
        s.id === id ? { ...s, name, updated_at: new Date().toISOString() } : s
      )
      
      setStaff(updatedStaff)
      localStorage.setItem('mock_staff', JSON.stringify(updatedStaff))
      
      const updatedItem = updatedStaff.find(s => s.id === id)
      return { data: updatedItem, error: null }
    } else {
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
  }

  const deleteStaff = async (id: string) => {
    if (isMockMode) {
      const updatedStaff = staff.filter(s => s.id !== id)
      setStaff(updatedStaff)
      localStorage.setItem('mock_staff', JSON.stringify(updatedStaff))
      
      return { error: null }
    } else {
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
  }

  const refetch = async () => {
    if (isMockMode) {
      // モックなので何もしない
    } else {
      await fetchStaff()
    }
  }

  // リアルタイム監視（実際のSupabaseの場合のみ）
  useEffect(() => {
    if (!isMockMode) {
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
    }
  }, [])

  return {
    staff,
    loading,
    error,
    addStaff,
    updateStaff,
    deleteStaff,
    refetch
  }
}