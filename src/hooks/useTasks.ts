'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, TaskFormData } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { useMockTasks } from './useMockTasks'

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export function useTasks(date: string) {
  const mockTasks = useMockTasks(date)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // モックモードの場合はモックフックを使用
  if (isMockMode) {
    return mockTasks
  }

  const fetchTasks = async () => {
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

  const addTask = async (taskData: TaskFormData) => {
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

  const updateTask = async (id: string, taskData: Partial<TaskFormData>) => {
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

  const updateTaskStatus = async (id: string, status: 'not-started' | 'progress' | 'completed' | 'pending') => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status })
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

  const deleteTask = async (id: string) => {
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

  useEffect(() => {
    fetchTasks()

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
    refetch: fetchTasks
  }
}