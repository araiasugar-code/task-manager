'use client'

import { useState } from 'react'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth'
import { useTaskStore } from '@/stores/taskStore'
import { Task, TaskFormData } from '@/lib/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import TaskModal from './TaskModal'

export default function PersonalTaskMobileView() {
  const { user } = useUnifiedAuth()
  const { selectedDate } = useTaskStore()
  const { tasks, addTask, updateTask, deleteTask } = useUnifiedTasks(selectedDate)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  // ログインユーザーの名前を取得
  const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || user?.email
  
  // 本日のログインユーザーのタスクをフィルタリング
  const todayString = selectedDate
  const myTasks = tasks.filter(task => 
    task.date === todayString && 
    (task.staff_name === userName || task.created_by === user?.id)
  )

  // 時間別にソート
  const sortedTasks = myTasks.sort((a, b) => a.start_hour - b.start_hour)

  const openTaskModal = (task?: Task) => {
    setSelectedTask(task || null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const handleSaveTask = async (taskData: TaskFormData) => {
    const { error } = await addTask(taskData)
    if (error) {
      throw new Error(error)
    }
  }

  const handleUpdateTask = async (id: string, taskData: Partial<TaskFormData>) => {
    const { error } = await updateTask(id, taskData)
    if (error) {
      throw new Error(error)
    }
  }

  const handleDeleteTask = async (id: string) => {
    const { error } = await deleteTask(id)
    if (error) {
      throw new Error(error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '完了'
      case 'progress':
        return '進行中'
      case 'pending':
        return '保留'
      default:
        return '未着手'
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <h2 className="text-lg font-semibold">
          {userName}さんのタスク
        </h2>
        <p className="text-sm opacity-90">
          {format(new Date(selectedDate), 'M月d日（E）', { locale: ja })}
        </p>
      </div>

      {/* タスクリスト */}
      <div className="p-4 space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mb-4">本日のタスクはありません</p>
            <p className="text-red-500 font-bold">DEBUG: ボタンが表示されるはずです</p>
            
            {/* タスク追加ボタン（空の状態時） */}
            <button
              onClick={() => openTaskModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新しいタスクを追加
            </button>
          </div>
        ) : (
          sortedTasks.map((task, index) => (
            <div 
              key={task.id || index} 
              className="bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openTaskModal(task)}
            >
              <div className="p-4">
                {/* 時間 */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600">
                    {task.start_hour}:00 - {task.end_hour}:00
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                </div>
                
                {/* タスク名 */}
                <h3 className="font-medium text-gray-900 mb-2">
                  {task.task_name}
                </h3>
                
                {/* WBSコード（あれば） */}
                {task.wbs_code && (
                  <p className="text-xs text-gray-500">
                    WBS: {task.wbs_code}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* タスクがある場合の追加ボタン */}
        {sortedTasks.length > 0 && (
          <div className="pt-4">
            <button
              onClick={() => openTaskModal()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新しいタスクを追加
            </button>
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">タスクをタップして編集できます</p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>© 2025 日次タスク管理システム</p>
            <p>Developed by <span className="font-semibold">akihiro_arai</span></p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span>本番稼働中 Ver 1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* タスクモーダル */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveTask}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        task={selectedTask}
        staffName={userName}
      />
    </div>
  )
}