'use client'

import { useState } from 'react'
import { useUnifiedTasks as useTasks } from '@/hooks/useUnifiedTasks'
import { useTaskStore } from '@/stores/taskStore'
import { Task, TaskFormData } from '@/lib/types'
import { TIME_SLOTS, getTaskStatusColor, getHoursSpan } from '@/lib/utils'
import TaskModal from './TaskModal'

export default function MobileTaskView() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState<{
    staffName?: string
    startHour?: number
    endHour?: number
  }>({})

  const { selectedDate, getSelectedStaffNames } = useTaskStore()
  const { tasks, addTask, updateTask, updateTaskStatus, deleteTask, getTasksForStaff, loading } = useTasks(selectedDate)

  const selectedStaffNames = getSelectedStaffNames()

  const openTaskModal = (staffName?: string, startHour?: number, task?: Task) => {
    setSelectedTask(task || null)
    setModalConfig({
      staffName,
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

  const handleStatusClick = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    const statusOrder = ['not-started', 'progress', 'completed', 'pending']
    const currentIndex = statusOrder.indexOf(task.status)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length] as Task['status']
    
    await updateTaskStatus(task.id, nextStatus)
  }

  const getTaskForTimeSlot = (staffName: string, hour: number): Task | undefined => {
    return tasks.find(task => 
      task.staff_name === staffName && 
      task.start_hour <= hour && 
      task.end_hour > hour
    )
  }

  if (selectedStaffNames.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 6a3 3 0 106 0 3 3 0 00-6 0zM9 6v1a3 3 0 106 0V6" />
          </svg>
          出勤者を選択してください
        </div>
        <p className="text-sm text-gray-500">
          出勤者を選択すると、タスクが表示されます。
        </p>
      </div>
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
      <div className="space-y-6">
        {selectedStaffNames.map(staffName => {
          const staffTasks = getTasksForStaff(staffName)
          
          return (
            <div key={staffName} className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">{staffName}</h3>
              </div>
              
              <div className="p-4">
                <div className="space-y-2">
                  {TIME_SLOTS.map(slot => {
                    const task = getTaskForTimeSlot(staffName, slot.start)
                    
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
                            onClick={() => openTaskModal(staffName, task.start_hour, task)}
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
                          </div>
                        ) : (
                          <button
                            onClick={() => openTaskModal(staffName, slot.start)}
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
            </div>
          )
        })}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveTask}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        task={selectedTask}
        staffName={modalConfig.staffName}
        defaultStartHour={modalConfig.startHour}
        defaultEndHour={modalConfig.endHour}
      />
    </>
  )
}