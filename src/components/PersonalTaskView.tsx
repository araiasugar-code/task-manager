'use client'

import { useState } from 'react'
import { useUnifiedTasks as useTasks } from '@/hooks/useUnifiedTasks'
import { useTaskStore } from '@/stores/taskStore'
import { useUnifiedAuth as useAuth } from '@/hooks/useUnifiedAuth'
import { Task, TaskFormData } from '@/lib/types'
import { TIME_SLOTS, getTaskStatusColor, getHoursSpan, calculateWorkingHours, formatWorkingHours } from '@/lib/utils'
import TaskModal from './TaskModal'

export default function PersonalTaskView() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState<{
    staffName?: string
    startHour?: number
    endHour?: number
  }>({})

  const { user } = useAuth()
  const { selectedDate } = useTaskStore()
  const { tasks, addTask, updateTask, updateTaskStatus, deleteTask, loading } = useTasks(selectedDate)

  // ユーザーの表示名を取得（スタッフ名と一致するように統一）
  const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || user?.email || 'あなた'
  
  // 現在のユーザーのタスクのみフィルタリング（重複除去付き）
  const userTasks = tasks.filter(task => {
    // 削除されたスタッフのタスクを除外
    try {
      const deletedStaff = JSON.parse(localStorage.getItem('deleted_staff') || '[]')
      if (deletedStaff.includes(task.staff_name)) {
        return false
      }
    } catch (error) {
      console.error('Error reading deleted_staff from localStorage:', error)
    }
    
    // スタッフ名でマッチング（優先）
    if (task.staff_name === userName) return true
    
    // created_byでマッチング（ログインユーザーが作成したタスク）
    if (task.created_by === user?.id) return true
    
    // デモモードの場合は条件を緩和
    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      // メールアドレスの@マーク前部分でもマッチング
      const emailPrefix = user?.email?.split('@')[0]
      if (emailPrefix && task.staff_name === emailPrefix) return true
    }
    
    return false
  }).filter((task, index, array) => {
    // IDによる重複除去
    return array.findIndex(t => t.id === task.id) === index
  })

  const openTaskModal = (staffName?: string, startHour?: number, task?: Task) => {
    setSelectedTask(task || null)
    setModalConfig({
      staffName: staffName || userName,
      startHour,
      endHour: startHour ? startHour + 1 : undefined
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedTask(null)
    setModalConfig({})
  }

  const checkTimeOverlap = (taskData: TaskFormData, excludeTaskId?: string) => {
    return userTasks.some(task => {
      if (excludeTaskId && task.id === excludeTaskId) return false
      
      // 時間の重複をチェック
      const hasOverlap = (
        (taskData.start_hour < task.end_hour && taskData.end_hour > task.start_hour)
      )
      return hasOverlap
    })
  }

  const handleSaveTask = async (taskData: TaskFormData) => {
    const fullTaskData = {
      ...taskData,
      staff_name: userName // 強制的に現在のユーザー名を設定
    }
    
    if (checkTimeOverlap(fullTaskData)) {
      throw new Error('この時間帯には既に別のタスクが登録されています')
    }
    
    const { error } = await addTask(fullTaskData)
    if (error) {
      throw new Error(error)
    }
  }

  const handleUpdateTask = async (id: string, taskData: Partial<TaskFormData>) => {
    if (taskData.start_hour !== undefined && taskData.end_hour !== undefined && 
        taskData.staff_name !== undefined) {
      if (checkTimeOverlap(taskData as TaskFormData, id)) {
        throw new Error('この時間帯には既に別のタスクが登録されています')
      }
    }
    
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

  const handleStatusClick = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    const statusOrder = ['not-started', 'progress', 'completed', 'pending']
    const currentIndex = statusOrder.indexOf(task.status)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length] as Task['status']
    
    await updateTaskStatus(task.id, nextStatus)
  }

  const getTaskForTimeSlot = (hour: number): Task | undefined => {
    return userTasks.find(task => 
      task.start_hour <= hour && 
      task.end_hour > hour
    )
  }

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8">
        読み込み中...
      </div>
    )
  }

  return (
    <>
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            {userName}さんのタスク
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            タスクをタップして編集・ステータス変更ができます
          </p>
        </div>
        
        <div className="p-4">
          <div className="space-y-2">
            {TIME_SLOTS.map(slot => {
              const task = getTaskForTimeSlot(slot.start)
              
              if (task && task.start_hour !== slot.start) {
                return null // スパンされているセルはスキップ
              }
              
              return (
                <div key={slot.start} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-gray-400 text-center shrink-0">
                    {slot.start}:00<br/>-{slot.end}:00
                  </div>
                  
                  {task ? (
                    <div
                      onClick={() => openTaskModal(userName, task.start_hour, task)}
                      className={`flex-1 bg-gradient-to-r ${getTaskStatusColor(task.status)} rounded-lg p-3 cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-medium text-sm">
                          {task.task_name}
                        </h4>
                        <span className="text-white/70 text-xs">
                          {getHoursSpan(task.start_hour, task.end_hour)}h
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-xs">
                          {task.start_hour}:00 - {task.end_hour}:00
                        </span>
                        <button
                          onClick={(e) => handleStatusClick(task, e)}
                          className="bg-black/20 hover:bg-black/40 text-white text-xs px-2 py-1 rounded transition-colors"
                        >
                          {task.status === 'not-started' && '未着手'}
                          {task.status === 'progress' && '進行中'}
                          {task.status === 'completed' && '完了'}
                          {task.status === 'pending' && '保留'}
                        </button>
                      </div>
                      {task.wbs_code && (
                        <div className="mt-2">
                          <span className="text-white/60 text-xs bg-black/20 px-2 py-1 rounded">
                            {task.wbs_code}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => openTaskModal(userName, slot.start)}
                      className="flex-1 border-2 border-dashed border-gray-600 hover:border-gray-500 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg p-3 transition-colors group"
                    >
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="ml-2 text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                          タスクを追加
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 統計情報 */}
        <div className="p-4 border-t border-gray-700 bg-gray-700/30">
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-400">総タスク</span>
              <span className="text-white">{userTasks.length}件</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">完了</span>
              <span className="text-green-400">
                {userTasks.filter(t => t.status === 'completed').length}件
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">進行中</span>
              <span className="text-orange-400">
                {userTasks.filter(t => t.status === 'progress').length}件
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">完了率</span>
              <span className="text-green-400">
                {userTasks.length > 0 
                  ? Math.round((userTasks.filter(t => t.status === 'completed').length / userTasks.length) * 100)
                  : 0}%
              </span>
            </div>
          </div>
          
          {/* 稼働時間情報 */}
          <div className="border-t border-gray-600 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-300 text-sm font-medium">今日の稼働時間</span>
              </div>
              <span className="text-blue-400 font-semibold">
                {formatWorkingHours(calculateWorkingHours(userTasks))}
              </span>
            </div>
            
            {/* デバッグ情報 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 text-xs text-gray-500">
                <div>表示タスク数: {userTasks.length}</div>
                <div>計算時間: {calculateWorkingHours(userTasks)}h</div>
                {userTasks.map(task => (
                  <div key={task.id}>
                    {task.task_name}: {task.start_hour}:00-{task.end_hour}:00 ({task.end_hour - task.start_hour}h)
                  </div>
                ))}
              </div>
            )}
            
            {/* 稼働時間の内訳 */}
            {userTasks.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">完了済み</span>
                    <span className="text-green-400">
                      {formatWorkingHours(calculateWorkingHours(userTasks.filter(t => t.status === 'completed')))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">進行中</span>
                    <span className="text-orange-400">
                      {formatWorkingHours(calculateWorkingHours(userTasks.filter(t => t.status === 'progress')))}
                    </span>
                  </div>
                </div>
                
                {/* 稼働時間バー */}
                <div className="mt-3">
                  <div className="bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((calculateWorkingHours(userTasks) / 8) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0h</span>
                    <span>8h (標準)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveTask}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        task={selectedTask}
        staffName={userName}
        defaultStartHour={modalConfig.startHour}
        defaultEndHour={modalConfig.endHour}
        checkTimeOverlap={checkTimeOverlap}
      />
    </>
  )
}