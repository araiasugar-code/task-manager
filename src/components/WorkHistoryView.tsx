'use client'

import { useState, useEffect } from 'react'
import { useUnifiedTasks as useTasks } from '@/hooks/useUnifiedTasks'
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth'
import { formatDisplayDate, calculateWorkingHours, formatWorkingHours, calculateWorkingHoursByStaff } from '@/lib/utils'
import { Task } from '@/lib/types'

interface DayRecord {
  date: string
  totalHours: number
  totalTasks: number
  completedTasks: number
  completionRate: number
  tasks: Task[]
}

interface MonthlyStats {
  month: string
  totalDays: number
  totalHours: number
  averageHours: number
  totalTasks: number
  completionRate: number
}

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export default function WorkHistoryView() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [monthlyRecords, setMonthlyRecords] = useState<DayRecord[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useUnifiedAuth()

  // 月の全日付を取得
  const getDatesInMonth = (month: string): string[] => {
    const [year, monthNum] = month.split('-').map(Number)
    const daysInMonth = new Date(year, monthNum, 0).getDate()
    const dates = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      dates.push(date)
    }
    
    return dates
  }

  // 月別データを取得
  const fetchMonthlyData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const dates = getDatesInMonth(selectedMonth)
      const records: DayRecord[] = []
      
      if (isMockMode) {
        // モックモード - ローカルストレージから全タスクを取得
        const storedTasks = localStorage.getItem('mock_tasks')
        const allTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : []
        
        dates.forEach(date => {
          const dayTasks = allTasks.filter(task => {
            if (task.date !== date) return false
            
            // 現在のユーザーのタスクのみ
            const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || user?.email
            const matchByName = task.staff_name === userName
            const matchById = task.created_by === user?.id
            
            if (date === new Date().toISOString().split('T')[0] && allTasks.length > 0) {
              console.log('=== WorkHistory Debug ===')
              console.log('Date:', date)
              console.log('User:', { userName, id: user?.id })
              console.log('Task:', { staff_name: task.staff_name, created_by: task.created_by, task_name: task.task_name })
              console.log('Match by name:', matchByName, 'Match by ID:', matchById)
              console.log('========================')
            }
            
            return matchByName || matchById
          })
          
          if (dayTasks.length > 0) {
            const totalHours = calculateWorkingHours(dayTasks)
            const completedTasks = dayTasks.filter(t => t.status === 'completed').length
            
            records.push({
              date,
              totalHours,
              totalTasks: dayTasks.length,
              completedTasks,
              completionRate: dayTasks.length > 0 ? Math.round((completedTasks / dayTasks.length) * 100) : 0,
              tasks: dayTasks
            })
          }
        })
      } else {
        // 実際のSupabase実装は後で追加
        // 現在はモックモードのみ対応
      }
      
      setMonthlyRecords(records.sort((a, b) => b.date.localeCompare(a.date)))
      
      // 月間統計を計算
      if (records.length > 0) {
        const totalHours = records.reduce((sum, record) => sum + record.totalHours, 0)
        const totalTasks = records.reduce((sum, record) => sum + record.totalTasks, 0)
        const totalCompleted = records.reduce((sum, record) => sum + record.completedTasks, 0)
        
        setMonthlyStats({
          month: selectedMonth,
          totalDays: records.length,
          totalHours,
          averageHours: records.length > 0 ? totalHours / records.length : 0,
          totalTasks,
          completionRate: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0
        })
      } else {
        setMonthlyStats(null)
      }
      
    } catch (error) {
      console.error('Failed to fetch monthly data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonthlyData()
  }, [selectedMonth, user])

  // 自動更新（5秒ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchMonthlyData()
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [user, selectedMonth])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">稼働実績履歴</h2>
            <p className="text-sm text-slate-600 mt-1">過去の作業記録を確認できます</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMonthlyData}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
              title="手動更新"
            >
              🔄 更新
            </button>
            <div>
              <label htmlFor="month-select" className="block text-sm font-medium text-slate-700 mb-2">
                表示月
              </label>
              <input
                id="month-select"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:border-blue-500"
            />
            </div>
          </div>
        </div>
      </div>

      {/* 月間統計 */}
      {monthlyStats && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {selectedMonth.replace('-', '年')}月の統計
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{monthlyStats.totalDays}</div>
              <div className="text-sm text-gray-600">稼働日数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatWorkingHours(monthlyStats.totalHours)}
              </div>
              <div className="text-sm text-gray-600">総稼働時間</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatWorkingHours(monthlyStats.averageHours)}
              </div>
              <div className="text-sm text-gray-600">1日平均時間</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{monthlyStats.completionRate}%</div>
              <div className="text-sm text-gray-600">平均完了率</div>
            </div>
          </div>
        </div>
      )}

      {/* 日別実績リスト */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">日別実績</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-600">
            読み込み中...
          </div>
        ) : monthlyRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>選択した月に稼働実績がありません</p>
            <p className="text-sm mt-1">タスクを作成すると、ここに履歴が表示されます</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {monthlyRecords.map((record, index) => (
              <div key={record.date} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <h4 className="font-medium text-slate-800">
                      {formatDisplayDate(record.date)}
                    </h4>
                    {index === 0 && record.date === new Date().toISOString().split('T')[0] && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        今日
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-600">
                      {formatWorkingHours(record.totalHours)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {record.completedTasks}/{record.totalTasks}件完了
                    </div>
                  </div>
                </div>
                
                {/* 完了率バー */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${record.completionRate}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 min-w-[3rem]">
                    {record.completionRate}%
                  </span>
                </div>
                
                {/* タスクリスト（最初の3つ） */}
                <div className="space-y-1">
                  {record.tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="text-sm text-gray-600 flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'progress' ? 'bg-orange-500' :
                        task.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></span>
                      <span className="truncate flex-1">{task.task_name}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        {task.start_hour}:00-{task.end_hour}:00
                      </span>
                    </div>
                  ))}
                  {record.tasks.length > 3 && (
                    <div className="text-xs text-gray-500 mt-1">
                      他 {record.tasks.length - 3} 件のタスク
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}