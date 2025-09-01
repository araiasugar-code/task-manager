'use client'

import { useState, useEffect, useRef } from 'react'
import { Task, TaskFormData } from '@/lib/types'
import { TIME_SLOTS } from '@/lib/utils'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: TaskFormData) => Promise<void>
  onUpdate?: (id: string, taskData: Partial<TaskFormData>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  task?: Task | null
  staffName?: string
  defaultStartHour?: number
  defaultEndHour?: number
  checkTimeOverlap?: (taskData: TaskFormData, excludeTaskId?: string) => boolean
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  task,
  staffName,
  defaultStartHour,
  defaultEndHour,
  checkTimeOverlap
}: TaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    staff_name: '',
    task_name: '',
    start_hour: 8,
    end_hour: 9,
    status: 'not-started',
    wbs_code: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          staff_name: task.staff_name,
          task_name: task.task_name,
          start_hour: task.start_hour,
          end_hour: task.end_hour,
          status: task.status,
          wbs_code: task.wbs_code || ''
        })
      } else {
        setFormData({
          staff_name: staffName || '',
          task_name: '',
          start_hour: defaultStartHour || 8,
          end_hour: defaultEndHour || 9,
          status: 'not-started',
          wbs_code: ''
        })
      }
      setError(null)
    }
  }, [isOpen, task, staffName, defaultStartHour, defaultEndHour])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.task_name.trim()) {
      setError('タスク名を入力してください')
      return
    }

    if (formData.start_hour >= formData.end_hour) {
      setError('終了時間は開始時間より後に設定してください')
      return
    }

    // 重複チェック
    if (checkTimeOverlap) {
      const hasOverlap = checkTimeOverlap(formData, task?.id)
      if (hasOverlap) {
        setError('この時間帯には既に別のタスクが登録されています')
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      if (task && onUpdate) {
        await onUpdate(task.id, formData)
      } else {
        await onSave(formData)
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !onDelete) return
    
    if (confirm('このタスクを削除しますか？')) {
      setLoading(true)
      try {
        await onDelete(task.id)
        onClose()
      } catch (err: any) {
        setError(err.message || '削除に失敗しました')
      } finally {
        setLoading(false)
      }
    }
  }

  const getHourFromPosition = (clientX: number): number => {
    if (!timelineRef.current) return 8
    
    const rect = timelineRef.current.getBoundingClientRect()
    const relativeX = clientX - rect.left
    const hourWidth = rect.width / 14 // 14時間分（8-22時）
    const hour = Math.round(relativeX / hourWidth) + 8
    
    return Math.max(8, Math.min(22, hour))
  }

  const handleMouseDown = (type: 'start' | 'end', e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(type)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const hour = getHourFromPosition(e.clientX)
    
    if (isDragging === 'start') {
      if (hour < formData.end_hour) {
        setFormData(prev => ({ ...prev, start_hour: hour }))
      }
    } else if (isDragging === 'end') {
      if (hour > formData.start_hour) {
        setFormData(prev => ({ ...prev, end_hour: hour }))
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  // グローバルなmouseupとmousemoveイベントハンドリング
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return
      
      const hour = getHourFromPosition(e.clientX)
      
      if (isDragging === 'start') {
        if (hour < formData.end_hour) {
          setFormData(prev => ({ ...prev, start_hour: hour }))
        }
      } else if (isDragging === 'end') {
        if (hour > formData.start_hour) {
          setFormData(prev => ({ ...prev, end_hour: hour }))
        }
      }
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(null)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, formData.start_hour, formData.end_hour])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              {task ? 'タスク編集' : 'タスク作成'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="staff_name" className="block text-sm font-medium text-gray-300 mb-2">
                担当者
              </label>
              <input
                type="text"
                id="staff_name"
                value={formData.staff_name}
                onChange={(e) => setFormData(prev => ({ ...prev, staff_name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="担当者名"
                required
                // 個人タスクビュー（PersonalTaskView）からの場合は編集不可
                disabled={staffName !== undefined && staffName !== ''}
              />
            </div>

            <div>
              <label htmlFor="task_name" className="block text-sm font-medium text-gray-300 mb-2">
                タスク名
              </label>
              <input
                type="text"
                id="task_name"
                value={formData.task_name}
                onChange={(e) => setFormData(prev => ({ ...prev, task_name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="例: DB設計書作成"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                時間設定 ({formData.start_hour}:00 - {formData.end_hour}:00)
              </label>
              
              {/* ドラッグ可能なタイムライン */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div 
                  ref={timelineRef}
                  className="relative h-12 bg-gray-600 rounded cursor-pointer"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  {/* 時間軸の目盛り */}
                  <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-gray-400 -mb-1">
                    {[8, 10, 12, 14, 16, 18, 20, 22].map(hour => (
                      <span key={hour} className="text-xs">
                        {hour}
                      </span>
                    ))}
                  </div>
                  
                  {/* タスク時間バー */}
                  <div
                    className="absolute top-6 h-6 bg-blue-500 rounded opacity-80 hover:opacity-100 transition-opacity"
                    style={{
                      left: `${((formData.start_hour - 8) / 14) * 100}%`,
                      width: `${((formData.end_hour - formData.start_hour) / 14) * 100}%`
                    }}
                  >
                    {/* 開始時間ハンドル */}
                    <div
                      className="absolute left-0 top-0 w-3 h-6 bg-blue-700 rounded-l cursor-ew-resize hover:bg-blue-600"
                      onMouseDown={(e) => handleMouseDown('start', e)}
                    />
                    
                    {/* 終了時間ハンドル */}
                    <div
                      className="absolute right-0 top-0 w-3 h-6 bg-blue-700 rounded-r cursor-ew-resize hover:bg-blue-600"
                      onMouseDown={(e) => handleMouseDown('end', e)}
                    />
                    
                    {/* 時間表示 */}
                    <div className="flex items-center justify-center h-full text-white text-xs font-medium">
                      {formData.end_hour - formData.start_hour}h
                    </div>
                  </div>
                </div>
                
                {/* 従来の選択肢も残す */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <select
                      value={formData.start_hour}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        start_hour: parseInt(e.target.value),
                        end_hour: Math.max(prev.end_hour, parseInt(e.target.value) + 1)
                      }))}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      {TIME_SLOTS.map(slot => (
                        <option key={slot.start} value={slot.start}>
                          {slot.start}:00開始
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <select
                      value={formData.end_hour}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_hour: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      {TIME_SLOTS.filter(slot => slot.end > formData.start_hour).map(slot => (
                        <option key={slot.end} value={slot.end}>
                          {slot.end}:00終了
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                ステータス
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="not-started">未着手</option>
                <option value="progress">進行中</option>
                <option value="completed">完了</option>
                <option value="pending">保留</option>
              </select>
            </div>

            <div>
              <label htmlFor="wbs_code" className="block text-sm font-medium text-gray-300 mb-2">
                WBSコード（任意）
              </label>
              <input
                type="text"
                id="wbs_code"
                value={formData.wbs_code}
                onChange={(e) => setFormData(prev => ({ ...prev, wbs_code: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="例: WBS-001"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {task && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  削除
                </button>
              )}
              <div className="flex-1 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {loading ? '処理中...' : (task ? '更新' : '作成')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}