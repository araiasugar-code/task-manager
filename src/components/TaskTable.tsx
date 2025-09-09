'use client'

import { useState, useRef, useEffect } from 'react'
import { useUnifiedTasks as useTasks } from '@/hooks/useUnifiedTasks'
import { useTaskStore } from '@/stores/taskStore'
import { Task, TaskFormData } from '@/lib/types'
import { TIME_SLOTS, getTaskStatusColor, getHoursSpan, calculateWorkingHours, formatWorkingHours } from '@/lib/utils'
import TaskModal from './TaskModal'

export default function TaskTable() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState<{
    staffName?: string
    startHour?: number
    endHour?: number
  }>({})
  const [dragState, setDragState] = useState<{
    taskId: string
    type: 'start' | 'end'
    initialX: number
    originalValue: number
  } | null>(null)
  const [dragError, setDragError] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const { selectedDate, getSelectedStaffNames } = useTaskStore()
  const { tasks, addTask, updateTask, updateTaskStatus, deleteTask, loading } = useTasks(selectedDate)

  const selectedStaffNames = getSelectedStaffNames()
  
  // 削除されたスタッフのタスクを除外
  const filteredTasks = tasks.filter(task => {
    // 削除されたスタッフのタスクを除外（モック・本番問わず）
    try {
      const deletedStaff = JSON.parse(localStorage.getItem('deleted_staff') || '[]')
      if (deletedStaff.includes(task.staff_name)) {
        return false
      }
    } catch (error) {
      console.error('Error reading deleted_staff from localStorage:', error)
    }
    return true
  })

  // ドラッグイベントの管理
  useEffect(() => {
    if (dragState) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e)
      const handleMouseUp = (e: MouseEvent) => handleDragEnd(e)
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState])

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

  const checkTimeOverlap = (taskData: TaskFormData, excludeTaskId?: string) => {
    return filteredTasks.some(task => {
      if (excludeTaskId && task.id === excludeTaskId) return false
      if (task.staff_name !== taskData.staff_name) return false
      
      // 時間の重複をチェック
      const hasOverlap = (
        (taskData.start_hour < task.end_hour && taskData.end_hour > task.start_hour)
      )
      return hasOverlap
    })
  }

  const handleSaveTask = async (taskData: TaskFormData) => {
    if (checkTimeOverlap(taskData)) {
      throw new Error('この時間帯には既に別のタスクが登録されています')
    }
    
    const { error } = await addTask(taskData)
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

  const getTaskForTimeSlot = (staffName: string, hour: number): Task | undefined => {
    return filteredTasks.find(task => 
      task.staff_name === staffName && 
      task.start_hour <= hour && 
      task.end_hour > hour
    )
  }

  const isTaskStart = (task: Task, hour: number): boolean => {
    return task.start_hour === hour
  }

  const getHourFromMousePosition = (clientX: number): number => {
    if (!tableRef.current) return 8
    
    const rect = tableRef.current.getBoundingClientRect()
    const relativeX = clientX - rect.left - 150 // スタッフ列の幅を引く
    const cellWidth = (rect.width - 150) / 14 // 14時間分
    const hour = Math.round(relativeX / cellWidth) + 8
    
    return Math.max(8, Math.min(22, hour))
  }

  const handleDragStart = (task: Task, type: 'start' | 'end', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragState({
      taskId: task.id,
      type,
      initialX: e.clientX,
      originalValue: type === 'start' ? task.start_hour : task.end_hour
    })
  }

  const handleDragMove = (e: MouseEvent) => {
    if (!dragState) return
    
    const newHour = getHourFromMousePosition(e.clientX)
    const task = filteredTasks.find(t => t.id === dragState.taskId)
    if (!task) return

    let newStartHour = task.start_hour
    let newEndHour = task.end_hour

    if (dragState.type === 'start') {
      newStartHour = Math.min(newHour, task.end_hour - 1)
    } else {
      newEndHour = Math.max(newHour, task.start_hour + 1)
    }

    if (newStartHour !== task.start_hour || newEndHour !== task.end_hour) {
      // リアルタイム更新は重いのでドラッグ終了時に実行
    }
  }

  const handleDragEnd = async (e: MouseEvent) => {
    if (!dragState) return
    
    const newHour = getHourFromMousePosition(e.clientX)
    const task = filteredTasks.find(t => t.id === dragState.taskId)
    if (!task) {
      setDragState(null)
      return
    }

    let newStartHour = task.start_hour
    let newEndHour = task.end_hour

    if (dragState.type === 'start') {
      newStartHour = Math.min(newHour, task.end_hour - 1)
    } else {
      newEndHour = Math.max(newHour, task.start_hour + 1)
    }

    if (newStartHour !== task.start_hour || newEndHour !== task.end_hour) {
      // 重複チェック
      const wouldOverlap = checkTimeOverlap({
        staff_name: task.staff_name,
        start_hour: newStartHour,
        end_hour: newEndHour,
        task_name: task.task_name,
        status: task.status,
        wbs_code: task.wbs_code || ''
      }, task.id)

      if (wouldOverlap) {
        // 重複する場合は元の位置に戻す（何もしない）
        setDragError('時間が重複しています。他のタスクと重ならない時間に設定してください。')
        setTimeout(() => setDragError(null), 3000) // 3秒後にエラーメッセージを消す
        setDragState(null)
        return
      }

      try {
        const { error } = await updateTask(task.id, {
          start_hour: newStartHour,
          end_hour: newEndHour
        })
        
        if (error) {
          console.error('Task update failed:', error)
          setDragError('タスクの更新に失敗しました')
          setTimeout(() => setDragError(null), 3000)
        }
      } catch (error) {
        console.error('Task update failed:', error)
        setDragError('タスクの更新に失敗しました')
        setTimeout(() => setDragError(null), 3000)
      }
    }

    setDragState(null)
  }

  if (selectedStaffNames.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-300 p-8 text-center">
        <div className="text-gray-600 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 6a3 3 0 106 0 3 3 0 00-6 0zM9 6v1a3 3 0 106 0V6" />
          </svg>
          出勤者を選択してください
        </div>
        <p className="text-sm text-gray-500">
          上のパネルから今日の出勤者を選択すると、タスクテーブルが表示されます。
        </p>
      </div>
    )
  }

  return (
    <>
      {/* ドラッグエラーメッセージ */}
      {dragError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          {dragError}
        </div>
      )}
      
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <div ref={tableRef} className="min-w-max">
            {/* ヘッダー */}
            <div className="grid grid-cols-[150px_repeat(14,minmax(80px,1fr))] border-b border-slate-300">
              <div className="p-3 bg-slate-50/80 font-medium text-slate-700 border-r border-slate-300">
                スタッフ
              </div>
              {TIME_SLOTS.map(slot => (
                <div key={slot.start} className="p-2 bg-slate-50/80 text-center text-xs text-slate-600 border-r border-slate-300">
                  <div>{slot.start}</div>
                  <div className="text-slate-400">-{slot.end}</div>
                </div>
              ))}
            </div>

            {/* タスク行 */}
            {loading ? (
              <div className="p-8 text-center text-gray-600">
                読み込み中...
              </div>
            ) : (
              selectedStaffNames.map(staffName => {
                const staffTasks = filteredTasks.filter(task => task.staff_name === staffName)
                const staffWorkingHours = calculateWorkingHours(staffTasks)
                
                return (
                <div key={staffName} className="grid grid-cols-[150px_repeat(14,minmax(80px,1fr))] border-b border-slate-200">
                  <div className="p-3 bg-slate-50/60 font-medium text-slate-700 border-r border-slate-300 flex flex-col justify-center">
                    <div>{staffName}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {formatWorkingHours(staffWorkingHours)}
                    </div>
                  </div>
                  {TIME_SLOTS.map(slot => {
                    const task = getTaskForTimeSlot(staffName, slot.start)
                    const isStart = task && isTaskStart(task, slot.start)
                    
                    if (task && !isStart) {
                      return null // 空のセルは何も描画しない
                    }

                    return (
                      <div
                        key={slot.start}
                        className="border-r border-slate-300 h-[50px] relative bg-slate-50/30"
                        style={{
                          gridColumn: task && isStart 
                            ? `span ${getHoursSpan(task.start_hour, task.end_hour)}` 
                            : undefined
                        }}
                      >
                        {task && isStart ? (
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${getTaskStatusColor(task.status)} m-0.5 rounded cursor-pointer hover:opacity-90 transition-all duration-200 p-1 flex items-center overflow-hidden group shadow-sm border border-white/20`}
                            onDoubleClick={(e) => {
                              // ダブルクリックでモーダルを開く（ドラッグとの競合を避ける）
                              e.stopPropagation()
                              openTaskModal(staffName, task.start_hour, task)
                            }}
                            onContextMenu={(e) => {
                              // 右クリックでもモーダルを開く
                              e.preventDefault()
                              e.stopPropagation()
                              openTaskModal(staffName, task.start_hour, task)
                            }}
                          >
                            {/* 開始時間ドラッグハンドル */}
                            <div
                              className="drag-handle absolute left-0 top-0 w-2 h-full bg-black/20 rounded-l cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onMouseDown={(e) => handleDragStart(task, 'start', e)}
                              title="開始時間を調整"
                            />
                            
                            {/* 終了時間ドラッグハンドル */}
                            <div
                              className="drag-handle absolute right-0 top-0 w-2 h-full bg-black/20 rounded-r cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onMouseDown={(e) => handleDragStart(task, 'end', e)}
                              title="終了時間を調整"
                            />
                            
                            {/* タスク内容部分 - 一行表示に固定 */}
                            <div 
                              className="flex-1 min-w-0 mr-2 flex items-center h-full cursor-pointer"
                              onDoubleClick={(e) => {
                                e.stopPropagation()
                                openTaskModal(staffName, task.start_hour, task)
                              }}
                            >
                              <span className="text-white text-xs font-medium truncate whitespace-nowrap">
                                {task.task_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-white/80 text-xs font-medium bg-black/20 px-1.5 py-0.5 rounded">
                                {getHoursSpan(task.start_hour, task.end_hour)}h
                              </span>
                              <button
                                onClick={(e) => handleStatusClick(task, e)}
                                className="status-button bg-white/20 hover:bg-white/30 text-white text-xs px-1.5 py-0.5 rounded font-medium transition-colors"
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
                            className="w-full h-full hover:bg-blue-50 transition-colors group flex items-center justify-center"
                            title="タスクを追加"
                          >
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
                )
              })
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
        staffName={modalConfig.staffName}
        defaultStartHour={modalConfig.startHour}
        defaultEndHour={modalConfig.endHour}
        checkTimeOverlap={checkTimeOverlap}
      />
    </>
  )
}