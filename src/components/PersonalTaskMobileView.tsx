'use client'

import { useState } from 'react'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth'
import { Task } from '@/lib/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function PersonalTaskMobileView() {
  const { user } = useUnifiedAuth()
  const { tasks } = useUnifiedTasks()
  const [selectedDate] = useState(new Date())
  
  // ログインユーザーの名前を取得
  const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || user?.email
  
  // 本日のログインユーザーのタスクをフィルタリング
  const todayString = format(selectedDate, 'yyyy-MM-dd')
  const myTasks = tasks.filter(task => 
    task.date === todayString && 
    (task.staff_name === userName || task.created_by === user?.id)
  )

  // 時間別にソート
  const sortedTasks = myTasks.sort((a, b) => a.start_hour - b.start_hour)

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
          {format(selectedDate, 'M月d日（E）', { locale: ja })}
        </p>
      </div>

      {/* タスクリスト */}
      <div className="p-4 space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>本日のタスクはありません</p>
          </div>
        ) : (
          sortedTasks.map((task, index) => (
            <div key={task.id || index} className="bg-white rounded-lg border border-gray-200 shadow-sm">
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
      </div>

      {/* フッター */}
      <div className="p-4 border-t border-gray-200 mt-8">
        <div className="text-center text-sm text-gray-500">
          <p>PC版で詳細な管理が可能です</p>
        </div>
      </div>
    </div>
  )
}