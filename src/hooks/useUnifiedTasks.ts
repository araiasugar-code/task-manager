'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, TaskFormData } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { mockTasks, personalMockTasks, historicalMockTasks } from '@/lib/mockData'
import { useUnifiedAuth } from './useUnifiedAuth'

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export function useUnifiedTasks(date: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useUnifiedAuth()
  const skipNextFetch = useRef(false)
  const fixedTaskIds = useRef<Set<string>>(new Set())

  const fetchTasks = async () => {
    if (isMockMode) {
      console.log(`📱 [FETCH] モックモード - データ取得をスキップ`)
      return
    }

    if (skipNextFetch.current) {
      console.log(`⏭️ [FETCH] スキップフラグ有効 - データ取得をスキップ`)
      skipNextFetch.current = false
      return
    }

    try {
      console.log(`🔄 [FETCH] Supabaseからタスクを取得中: date=${date}`)
      setLoading(true)
      
      // 認証状態を確認してユーザー情報を取得
      const { data: userData } = await supabase.auth.getUser()
      const currentUser = userData.user
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('date', date)
        .order('staff_name')
        .order('start_hour')

      if (error) throw error
      
      console.log(`📊 [FETCH] 取得成功: ${(data || []).length}件のタスク`)
      console.log('📊 [FETCH] 取得したタスクIDs:', data?.map(t => t.id))
      console.log('📊 [FETCH] タスク詳細:', data?.map(t => ({ id: t.id, task_name: t.task_name, staff_name: t.staff_name, created_by: t.created_by })))
      console.log(`👤 [FETCH] 現在のユーザーID (user prop): ${user?.id}`)
      console.log(`👤 [FETCH] 現在のユーザーID (auth.getUser): ${currentUser?.id}`)
      console.log(`🔒 [FETCH] 削除可能なタスク数: ${data?.filter(t => t.created_by === (currentUser?.id || user?.id)).length || 0}件`)
      
      setTasks(data || [])
      
      // 所有権が設定されていないタスクがあれば自動修正（認証状態を直接取得したユーザーIDを使用）
      const orphanTasks = data?.filter(t => !t.created_by && !fixedTaskIds.current.has(t.id)) || []
      const userIdToUse = currentUser?.id || user?.id
      if (orphanTasks.length > 0 && userIdToUse) {
        console.log(`🔧 [FETCH] 所有権未設定タスク${orphanTasks.length}件を修正中... (ユーザーID: ${userIdToUse})`)
        await fixOrphanTasks(orphanTasks.map(t => t.id), userIdToUse)
        // 修正したタスクIDを記録（無限ループ防止）
        orphanTasks.forEach(t => fixedTaskIds.current.add(t.id))
      }
    } catch (err: any) {
      console.error('❌ [FETCH] データ取得エラー:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fixOrphanTasks = async (taskIds: string[], userIdToUse?: string) => {
    const userId = userIdToUse || user?.id
    if (!userId || taskIds.length === 0) return
    
    try {
      console.log(`🔧 [FIX] タスク所有権修正開始: ${taskIds.length}件 (ユーザーID: ${userId})`)
      const { error } = await supabase
        .from('tasks')
        .update({ created_by: userId })
        .in('id', taskIds)
      
      if (error) {
        console.error('❌ [FIX] 所有権修正エラー:', error)
      } else {
        console.log(`✅ [FIX] 所有権修正完了: ${taskIds.length}件`)
      }
    } catch (err) {
      console.error('❌ [FIX] 所有権修正例外:', err)
    }
  }

  useEffect(() => {
    if (isMockMode) {
      // モックモード
      const storedTasks = localStorage.getItem('mock_tasks')
      let allTasks: Task[] = []
      
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks)
        // デモユーザー、存在しないユーザーのタスクをフィルタリングして除去
        const excludedNames = ['田中太郎', '佐藤花子', '山田次郎', '鈴木美香', '高橋健太', 'デモユーザー', 'demo', 'aaaaaaa', 'test', 'sample', 'テスト']
        allTasks = parsedTasks.filter((task: Task) => 
          !excludedNames.includes(task.staff_name)
        )
        localStorage.setItem('mock_tasks', JSON.stringify(allTasks))
      } else {
        // 初回時は空のタスクリストから開始（phantom staffを避けるため）
        allTasks = []
        localStorage.setItem('mock_tasks', JSON.stringify([]))
      }

      // 指定された日付のタスクのみフィルター
      const filteredTasks = allTasks.filter(task => task.date === date)
      setTasks(filteredTasks)
      setLoading(false)
    } else {
      // 実際のSupabase
      fetchTasks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const addTask = async (taskData: TaskFormData) => {
    if (isMockMode) {
      // モック処理
      const newTask: Task = {
        id: Date.now().toString(),
        date,
        ...taskData,
        created_by: user?.id || 'anonymous-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 全タスクを取得して新しいタスクを追加
      const storedTasks = localStorage.getItem('mock_tasks')
      const allTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : []
      const updatedAllTasks = [...allTasks, newTask]
      
      localStorage.setItem('mock_tasks', JSON.stringify(updatedAllTasks))
      
      // 現在の日付のタスクのみ更新
      if (newTask.date === date) {
        setTasks(prev => [...prev, newTask])
      }
      
      return { data: newTask, error: null }
    } else {
      try {
        const { data: userData } = await supabase.auth.getUser()
        
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            date,
            ...taskData,
            created_by: userData.user?.id
          })
          .select()
          .single()

        if (error) throw error
        setTasks(prev => [...prev, data])
        return { data, error: null }
      } catch (err: any) {
        return { data: null, error: err.message }
      }
    }
  }

  const updateTask = async (id: string, taskData: Partial<TaskFormData>) => {
    if (isMockMode) {
      // モック処理
      const storedTasks = localStorage.getItem('mock_tasks')
      const allTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : []
      
      const updatedAllTasks = allTasks.map(t => 
        t.id === id ? { ...t, ...taskData, updated_at: new Date().toISOString() } : t
      )
      
      localStorage.setItem('mock_tasks', JSON.stringify(updatedAllTasks))
      
      const updatedTask = updatedAllTasks.find(t => t.id === id)
      if (updatedTask && updatedTask.date === date) {
        setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      }
      
      return { data: updatedTask, error: null }
    } else {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        setTasks(prev => prev.map(t => t.id === id ? data : t))
        return { data, error: null }
      } catch (err: any) {
        return { data: null, error: err.message }
      }
    }
  }

  const updateTaskStatus = async (id: string, status: 'not-started' | 'progress' | 'completed' | 'pending') => {
    return updateTask(id, { status })
  }

  const deleteTask = async (id: string) => {
    console.log(`🗑️ [DELETE] タスク削除開始: ID=${id}`)
    
    // 認証状態を確認してユーザー情報を取得
    const { data: userData } = await supabase.auth.getUser()
    const currentUser = userData.user
    const userIdToUse = currentUser?.id || user?.id
    
    console.log(`👤 [DELETE] 現在のユーザー (user prop):`, user ? { id: user.id, email: user.email } : 'ユーザー未認証')
    console.log(`👤 [DELETE] 現在のユーザー (auth.getUser):`, currentUser ? { id: currentUser.id, email: currentUser.email } : 'ユーザー未認証')
    console.log(`👤 [DELETE] 使用するユーザーID: ${userIdToUse}`)
    
    if (isMockMode) {
      // モック処理
      console.log(`📱 [DELETE] モックモードで削除`)
      const storedTasks = localStorage.getItem('mock_tasks')
      const allTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : []
      
      const updatedAllTasks = allTasks.filter(t => t.id !== id)
      localStorage.setItem('mock_tasks', JSON.stringify(updatedAllTasks))
      
      setTasks(prev => {
        const filteredTasks = prev.filter(t => t.id !== id)
        console.log(`📱 [DELETE] ローカル状態更新: ${prev.length} → ${filteredTasks.length}`)
        return filteredTasks
      })
      
      return { error: null }
    } else {
      try {
        console.log(`🗄️ [DELETE] Supabaseからタスクを削除中: ID=${id}`)
        
        // まず削除前にタスクが存在するか確認
        const { data: existingTask, error: checkError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', id)
          .single()
        
        console.log(`🔍 [DELETE] 削除前のタスク存在確認:`, existingTask, checkError)
        
        if (existingTask) {
          console.log(`👨‍💼 [DELETE] タスク作成者: ${existingTask.created_by}`)
          console.log(`🔒 [DELETE] 権限チェック: 現在ユーザー(${userIdToUse}) === 作成者(${existingTask.created_by}) = ${userIdToUse === existingTask.created_by}`)
          
          // 所有権がない場合、強制的に現在ユーザーに変更
          if (existingTask.created_by !== userIdToUse && userIdToUse) {
            console.log(`🔧 [DELETE] 所有権を強制修正中... (ユーザーID: ${userIdToUse})`)
            const { error: updateError } = await supabase
              .from('tasks')
              .update({ created_by: userIdToUse })
              .eq('id', id)
            
            if (updateError) {
              console.error(`❌ [DELETE] 所有権修正エラー:`, updateError)
              throw updateError
            } else {
              console.log(`✅ [DELETE] 所有権修正完了`)
              // 所有権修正後、少し待ってから削除処理を実行
              await new Promise(resolve => setTimeout(resolve, 100))
            }
          }
        }
        
        console.log(`🗑️ [DELETE] 削除処理実行中: ID=${id}`)
        const { error, count } = await supabase
          .from('tasks')
          .delete({ count: 'exact' })
          .eq('id', id)
          .eq('created_by', userIdToUse)

        if (error) {
          console.error(`❌ [DELETE] Supabase削除エラー:`, error)
          throw error
        }
        
        console.log(`✅ [DELETE] Supabaseから削除成功: ${count}件削除`)
        
        // 削除後に再確認
        const { data: checkDeleted, error: postCheckError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', id)
          .single()
        
        console.log(`🔍 [DELETE] 削除後の確認 (nullまたはエラーであるべき):`, checkDeleted, postCheckError)
        
        setTasks(prev => {
          const filteredTasks = prev.filter(t => t.id !== id)
          console.log(`🗄️ [DELETE] ローカル状態更新: ${prev.length} → ${filteredTasks.length}`)
          console.log(`🗄️ [DELETE] 削除されたタスクID: ${id}`)
          console.log(`🗄️ [DELETE] 残りのタスクIDs:`, filteredTasks.map(t => t.id))
          return filteredTasks
        })
        
        // 次のfetchをスキップするフラグを設定（削除後の不要な再取得を防ぐ）
        skipNextFetch.current = true
        console.log(`🚫 [DELETE] 次のfetch処理をスキップ設定`)
        
        return { error: null }
      } catch (err: any) {
        console.error(`❌ [DELETE] 削除エラー:`, err)
        return { error: err.message }
      }
    }
  }

  const getTasksForStaff = (staffName: string) => {
    return tasks.filter(task => task.staff_name === staffName)
  }

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'progress').length
    const notStarted = tasks.filter(t => t.status === 'not-started').length
    const pending = tasks.filter(t => t.status === 'pending').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      completed,
      inProgress,
      notStarted,
      pending,
      completionRate
    }
  }

  const refetch = async () => {
    if (isMockMode) {
      // ローカルストレージから再読み込み
      const storedTasks = localStorage.getItem('mock_tasks')
      const allTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : []
      const filteredTasks = allTasks.filter(task => task.date === date)
      setTasks(filteredTasks)
    } else {
      await fetchTasks()
    }
  }

  // リアルタイム監視（一時的に無効化 - WebSocketエラー対応）
  useEffect(() => {
    // リアルタイム機能を無効化してテスト
    /*
    if (!isMockMode) {
      const channel = supabase
        .channel('tasks_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newTask = payload.new as Task
              if (newTask.date === date) {
                setTasks(prev => [...prev, newTask])
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedTask = payload.new as Task
              if (updatedTask.date === date) {
                setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedTask = payload.old as Task
              setTasks(prev => prev.filter(t => t.id !== deletedTask.id))
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
    */
  }, [date])

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    getTasksForStaff,
    getTaskStats,
    refetch
  }
}