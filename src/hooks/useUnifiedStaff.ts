'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { StaffMember } from '@/lib/types'
import { mockStaff } from '@/lib/mockData'
import { useUnifiedAuth } from './useUnifiedAuth'

// モックモードは環境変数に従う
const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export function useUnifiedStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useUnifiedAuth()

  // ログインユーザーを自動的にスタッフとして追加
  const ensureUserAsStaff = async () => {
    if (!user) return
    
    const userName = user.user_metadata?.display_name || user.email?.split('@')[0] || user.email
    if (!userName) return
    
    // 既にスタッフリストにいるかチェック
    const existingStaff = staff.find(s => s.name === userName)
    if (existingStaff) return
    
    // スタッフとして追加
    console.log('Adding logged-in user as staff:', userName)
    await addStaff(userName)
  }

  useEffect(() => {
    if (isMockMode) {
      const storedStaff = localStorage.getItem('mock_staff')
      if (storedStaff) {
        const parsedStaff = JSON.parse(storedStaff)
        
        // 削除済みリストを取得
        const deletedStaffNames = JSON.parse(localStorage.getItem('deleted_staff') || '[]')
        console.log('=== useUnifiedStaff Debug ===')
        console.log('Stored staff:', parsedStaff)
        console.log('Deleted staff names:', deletedStaffNames)
        
        // デモユーザー、存在しないユーザー、削除済みユーザーをフィルタリングして除去
        const phantomNames = ['田中太郎', '佐藤花子', '山田次郎', '鈴木美香', '高橋健太', 'デモユーザー', 'demo', 'aaaaaaa', 'test', 'sample', 'テスト', '山本']
        const allExcludedNames = [...phantomNames, ...deletedStaffNames]
        console.log('All excluded names:', allExcludedNames)
        
        const filteredStaff = parsedStaff.filter((s: StaffMember) => {
          const shouldExclude = allExcludedNames.includes(s.name)
          console.log(`Staff ${s.name}: shouldExclude=${shouldExclude}`)
          return !shouldExclude
        })
        
        console.log('Final filtered staff:', filteredStaff)
        setStaff(filteredStaff)
        localStorage.setItem('mock_staff', JSON.stringify(filteredStaff))
      } else {
        console.log('No stored staff, starting with empty array')
        // 初期状態では空のスタッフリストから開始
        setStaff([])
        localStorage.setItem('mock_staff', JSON.stringify([]))
      }
      setLoading(false)
    } else {
      fetchStaff()
    }
  }, [])

  // ログインユーザーの自動追加（問題修正版）
  useEffect(() => {
    if (user && !loading) {
      const userName = user.user_metadata?.display_name || user.email?.split('@')[0] || user.email
      if (userName && !staff.find(s => s.name === userName)) {
        console.log('Auto-adding user as staff (first time only):', userName)
        ensureUserAsStaff()
      }
    }
  }, [user, staff.length, loading]) // staff.lengthを監視して無限ループを防ぐ

  const fetchStaff = async () => {
    if (isMockMode) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      // 重複を除去（名前とメールアドレスで）+ phantom staffを除外
      const phantomNames = ['田中太郎', '佐藤花子', '山田次郎', '鈴木美香', '高橋健太', 'デモユーザー', 'demo', 'aaaaaaa', 'test', 'sample', 'テスト', '山本']
      const uniqueStaff = data?.reduce((acc: any[], current) => {
        const isDuplicate = acc.some(item => 
          item.name === current.name || 
          (item.email && current.email && item.email === current.email)
        )
        const isPhantom = phantomNames.includes(current.name)
        if (!isDuplicate && !isPhantom) {
          acc.push(current)
        }
        return acc
      }, []) || []
      
      console.log('Supabase staff filtered (removed phantoms):', uniqueStaff)
      setStaff(uniqueStaff)
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
    console.log('=== deleteStaff START ===')
    console.log('ID to delete:', id)
    console.log('isMockMode:', isMockMode)
    
    try {
      if (isMockMode) {
        console.log('MOCK MODE: Processing deletion')
        
        const staffToDelete = staff.find(s => s.id === id)
        console.log('Staff to delete:', staffToDelete)
        
        if (!staffToDelete) {
          console.error('Staff not found with id:', id)
          return { error: 'スタッフが見つかりません' }
        }
        
        // 削除済みリストに追加（重複防止）
        const deletedStaff = JSON.parse(localStorage.getItem('deleted_staff') || '[]')
        if (!deletedStaff.includes(staffToDelete.name)) {
          deletedStaff.push(staffToDelete.name)
          localStorage.setItem('deleted_staff', JSON.stringify(deletedStaff))
          console.log('Added to deleted list:', staffToDelete.name)
        }
        
        // 削除されたスタッフのタスクも削除
        const currentTasks = JSON.parse(localStorage.getItem('mock_tasks') || '[]')
        const cleanedTasks = currentTasks.filter((task: any) => task.staff_name !== staffToDelete.name)
        localStorage.setItem('mock_tasks', JSON.stringify(cleanedTasks))
        console.log(`Removed tasks for staff: ${staffToDelete.name}`)
        
        // LocalStorageとstateの両方を即座に更新
        const updatedStaff = staff.filter(s => s.id !== id)
        localStorage.setItem('mock_staff', JSON.stringify(updatedStaff))
        setStaff(updatedStaff)
        
        console.log('Deletion completed successfully')
        return { error: null }
      } else {
        console.log('SUPABASE MODE: Processing deletion')
        const staffToDelete = staff.find(s => s.id === id)
        
        if (!staffToDelete) {
          console.error('Staff not found with id:', id)
          return { error: 'スタッフが見つかりません' }
        }
        
        // スタッフを非アクティブに設定
        const { error: staffError } = await supabase
          .from('staff_members')
          .update({ is_active: false })
          .eq('id', id)

        if (staffError) {
          console.error('Supabase staff error:', staffError)
          throw staffError
        }
        
        // 削除されたスタッフのタスクも削除
        const { error: taskError } = await supabase
          .from('tasks')
          .delete()
          .eq('staff_name', staffToDelete.name)
          
        if (taskError) {
          console.warn('Failed to delete tasks for staff:', taskError)
          // タスク削除の失敗は警告に留める（スタッフ削除は続行）
        } else {
          console.log(`Removed tasks for staff: ${staffToDelete.name}`)
        }
        
        setStaff(prev => prev.filter(s => s.id !== id))
        console.log('Supabase deletion successful')
        return { error: null }
      }
    } catch (err: any) {
      console.error('=== deleteStaff ERROR ===', err)
      return { error: err.message || 'Unknown error' }
    } finally {
      console.log('=== deleteStaff END ===')
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