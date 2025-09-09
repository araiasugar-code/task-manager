'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUnifiedTasks as useTasks } from '@/hooks/useUnifiedTasks'
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth'
import { formatDisplayDate, calculateWorkingHours, formatWorkingHours, calculateWorkingHoursByStaff } from '@/lib/utils'
import { Task } from '@/lib/types'
import { supabase } from '@/lib/supabase'

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
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const { user } = useUnifiedAuth()

  // 月の全日付を取得
  const getDatesInMonth = useCallback((month: string): string[] => {
    const [year, monthNum] = month.split('-').map(Number)
    const daysInMonth = new Date(year, monthNum, 0).getDate()
    const dates = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      dates.push(date)
    }
    
    return dates
  }, [])

  // 月別データを取得（メモ化で最適化）
  const fetchMonthlyData = useCallback(async (forceRefresh = false) => {
    if (!user) {
      console.log('❌ [WORK_HISTORY] User not available')
      return
    }
    
    console.log('🔄 [WORK_HISTORY] Starting fetchMonthlyData', { forceRefresh, selectedMonth, isMockMode })
    console.log('🔄 [WORK_HISTORY] User object:', { id: user?.id, email: user?.email, display_name: user?.user_metadata?.display_name })
    
    // 頻繁な更新を防ぐ（30秒以内の再取得は無視、強制更新は除く）
    const now = Date.now()
    if (!forceRefresh && (now - lastFetchTime) < 30000) {
      console.log('⏭️ [WORK_HISTORY] Skipping fetch (too soon)', { timeSinceLastFetch: now - lastFetchTime })
      return
    }
    
    setLoading(true)
    try {
      const dates = getDatesInMonth(selectedMonth)
      const records: DayRecord[] = []
      
      if (isMockMode) {
        console.log('📱 [WORK_HISTORY] Mock mode - reading from localStorage')
        
        // モックモード - ローカルストレージから全タスクを取得
        const storedTasks = localStorage.getItem('mock_tasks')
        const allTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : []
        
        console.log('📱 [WORK_HISTORY] Total stored tasks:', allTasks.length)
        
        // 削除されたスタッフのタスクを除外
        const deletedStaff = JSON.parse(localStorage.getItem('deleted_staff') || '[]')
        const filteredTasks = allTasks.filter(task => !deletedStaff.includes(task.staff_name))
        
        console.log('📱 [WORK_HISTORY] Filtered tasks after removing deleted staff:', filteredTasks.length)
        console.log('📱 [WORK_HISTORY] Deleted staff:', deletedStaff)
        
        const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || user?.email
        console.log('📱 [WORK_HISTORY] Current user name:', userName, 'user.id:', user?.id)
        
        dates.forEach(date => {
          const dayTasks = filteredTasks.filter(task => {
            if (task.date !== date) return false
            
            // 現在のユーザーのタスクのみ
            const matchByName = task.staff_name === userName
            const matchById = task.created_by === user?.id
            
            const match = matchByName || matchById
            if (match) {
              console.log(`📱 [WORK_HISTORY] Found matching task for ${date}:`, task.task_name, { matchByName, matchById })
            }
            
            return match
          })
          
          if (dayTasks.length > 0) {
            const totalHours = calculateWorkingHours(dayTasks)
            const completedTasks = dayTasks.filter(t => t.status === 'completed').length
            
            console.log(`📱 [WORK_HISTORY] Adding record for ${date}:`, { totalTasks: dayTasks.length, totalHours, completedTasks })
            
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
        console.log('🗄️ [WORK_HISTORY] Supabase mode - fetching from database')
        
        // 実際のSupabase実装
        const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || user?.email
        
        console.log('🗄️ [WORK_HISTORY] Query params:', { userName, userId: user?.id, selectedMonth })
        
        // 月全体のタスクを一度に取得（効率化）
        const startDate = `${selectedMonth}-01`
        const endDate = `${selectedMonth}-31` // 月末日は自動調整される
        
        console.log('🗄️ [WORK_HISTORY] Query date range:', { startDate, endDate })
        
        // Supabaseクエリを修正：複数条件のORクエリ
        let query = supabase
          .from('tasks')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
        
        // ユーザー条件を追加（created_by または staff_name）
        if (user?.id && userName) {
          query = query.or(`created_by.eq.${user.id},staff_name.eq."${userName}"`)
        } else if (user?.id) {
          query = query.eq('created_by', user.id)
        } else if (userName) {
          query = query.eq('staff_name', userName)
        } else {
          console.log('❌ [WORK_HISTORY] No user ID or username available')
          return
        }
        
        const { data: monthTasks, error } = await query
        
        if (error) {
          console.error('❌ [WORK_HISTORY] Error fetching monthly tasks:', error)
          return
        }
        
        console.log('🗄️ [WORK_HISTORY] Fetched tasks from Supabase:', monthTasks?.length || 0)
        console.log('🗄️ [WORK_HISTORY] Sample tasks:', monthTasks?.slice(0, 3))
        
        // 日付ごとにグループ化
        const tasksByDate = (monthTasks || []).reduce((acc, task) => {
          if (!acc[task.date]) acc[task.date] = []
          acc[task.date].push(task)
          return acc
        }, {} as Record<string, Task[]>)
        
        console.log('🗄️ [WORK_HISTORY] Tasks grouped by date:', Object.keys(tasksByDate))
        
        dates.forEach(date => {
          const dayTasks = tasksByDate[date] || []
          
          if (dayTasks.length > 0) {
            const totalHours = calculateWorkingHours(dayTasks)
            const completedTasks = dayTasks.filter(t => t.status === 'completed').length
            
            console.log(`🗄️ [WORK_HISTORY] Adding record for ${date}:`, { totalTasks: dayTasks.length, totalHours, completedTasks })
            
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
      }
      
      console.log('📊 [WORK_HISTORY] Final records count:', records.length)
      setMonthlyRecords(records.sort((a, b) => b.date.localeCompare(a.date)))
      
      // 月間統計を計算
      if (records.length > 0) {
        const totalHours = records.reduce((sum, record) => sum + record.totalHours, 0)
        const totalTasks = records.reduce((sum, record) => sum + record.totalTasks, 0)
        const totalCompleted = records.reduce((sum, record) => sum + record.completedTasks, 0)
        
        const stats = {
          month: selectedMonth,
          totalDays: records.length,
          totalHours,
          averageHours: records.length > 0 ? totalHours / records.length : 0,
          totalTasks,
          completionRate: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0
        }
        
        console.log('📊 [WORK_HISTORY] Monthly stats:', stats)
        setMonthlyStats(stats)
      } else {
        console.log('📊 [WORK_HISTORY] No records found - setting stats to null')
        setMonthlyStats(null)
      }
      
      setLastFetchTime(now)
      console.log('✅ [WORK_HISTORY] fetchMonthlyData completed successfully')
      
    } catch (error) {
      console.error('❌ [WORK_HISTORY] Failed to fetch monthly data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, user?.id, getDatesInMonth]) // lastFetchTimeを依存配列から除外 // lastFetchTimeを依存配列から除外

  // 初回ロードと月変更時のみ実行
  useEffect(() => {
    fetchMonthlyData(true) // 強制更新
  }, [selectedMonth, user?.id]) // user?.idで絞り込み

  // 手動更新
  const handleManualRefresh = () => {
    fetchMonthlyData(true)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー - レスポンシブ改善 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                稼働実績履歴
              </h2>
              <p className="text-slate-600 mt-2">過去の作業記録と実績統計を確認できます</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
              {/* 月選択 */}
              <div>
                <label htmlFor="month-select" className="block text-sm font-medium text-slate-700 mb-2">
                  表示月
                </label>
                <input
                  id="month-select"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
              
              {/* 更新ボタン - 改善されたデザイン */}
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-md"
                title="データを手動で更新"
              >
                <svg 
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? '更新中...' : '更新'}
              </button>
              
              {/* デバッグボタン - 開発環境のみ */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    const tasks = localStorage.getItem('mock_tasks')
                    const parsed = tasks ? JSON.parse(tasks) : []
                    console.log('=== localStorage DEBUG ===')
                    console.log('Raw localStorage data:', tasks)
                    console.log('Parsed tasks:', parsed)
                    console.log('Total tasks:', parsed.length)
                    console.log('Records:', monthlyRecords)
                    console.log('Stats:', monthlyStats)
                    console.log('========================')
                    alert(`LocalStorage: ${parsed.length}件のタスク | 表示レコード: ${monthlyRecords.length}件`)
                  }}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                  title="デバッグ情報を表示"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 5a1 1 0 100 2v3a1 1 0 001 1h3a1 1 0 001-1V7a1 1 0 100-2H8zM9 11H7a1 1 0 000 2h2v-2zM11 13h2a1 1 0 000-2h-2v2z"/>
                  </svg>
                  Debug
                </button>
              )}
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