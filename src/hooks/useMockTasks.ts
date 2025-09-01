'use client'

import { useState, useEffect } from 'react'
import { Task, TaskFormData } from '@/lib/types'
import { mockTasks, personalMockTasks } from '@/lib/mockData'

export function useMockTasks(date: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // ローカルストレージからタスクデータを取得
    const storedTasks = localStorage.getItem('mock_tasks')
    let allTasks: Task[] = []
    
    if (storedTasks) {
      allTasks = JSON.parse(storedTasks)
    } else {
      // 初回時は通常のタスクと個人タスクの両方を含める
      allTasks = [...mockTasks, ...personalMockTasks]
      localStorage.setItem('mock_tasks', JSON.stringify(allTasks))
    }

    // 指定された日付のタスクのみフィルター
    const filteredTasks = allTasks.filter(task => task.date === date)
    setTasks(filteredTasks)
    setLoading(false)
  }, [date])

  const addTask = async (taskData: TaskFormData) => {
    const newTask: Task = {
      id: Date.now().toString(),
      date,
      ...taskData,
      created_by: 'mock-user-id',
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
  }

  const updateTask = async (id: string, taskData: Partial<TaskFormData>) => {
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
  }

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    return updateTask(id, { status })
  }

  const deleteTask = async (id: string) => {
    const storedTasks = localStorage.getItem('mock_tasks')
    const allTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : []
    
    const updatedAllTasks = allTasks.filter(t => t.id !== id)
    localStorage.setItem('mock_tasks', JSON.stringify(updatedAllTasks))
    
    setTasks(prev => prev.filter(t => t.id !== id))
    
    return { error: null }
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
    // ローカルストレージから再読み込み
    const storedTasks = localStorage.getItem('mock_tasks')
    const allTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : []
    const filteredTasks = allTasks.filter(task => task.date === date)
    setTasks(filteredTasks)
  }

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