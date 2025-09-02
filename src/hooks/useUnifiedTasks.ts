'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, TaskFormData } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { mockTasks, personalMockTasks, historicalMockTasks } from '@/lib/mockData'

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export function useUnifiedTasks(date: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async () => {
    if (isMockMode) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('date', date)
        .order('staff_name')
        .order('start_hour')

      if (error) throw error
      setTasks(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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
        created_by: 'demo-user-id',
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
    if (isMockMode) {
      // モック処理
      const storedTasks = localStorage.getItem('mock_tasks')
      const allTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : []
      
      const updatedAllTasks = allTasks.filter(t => t.id !== id)
      localStorage.setItem('mock_tasks', JSON.stringify(updatedAllTasks))
      
      setTasks(prev => prev.filter(t => t.id !== id))
      
      return { error: null }
    } else {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id)

        if (error) throw error
        setTasks(prev => prev.filter(t => t.id !== id))
        return { error: null }
      } catch (err: any) {
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

  // リアルタイム監視（実際のSupabaseの場合のみ）
  useEffect(() => {
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