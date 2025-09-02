'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUnifiedAuth as useAuth } from '@/hooks/useUnifiedAuth'
import { useUnifiedTasks as useTasks } from '@/hooks/useUnifiedTasks'
import { useTaskStore } from '@/stores/taskStore'
import { formatDisplayDate, calculateWorkingHours, calculateWorkingHoursByStaff, formatWorkingHours } from '@/lib/utils'
import TaskTable from '@/components/TaskTable'
import PersonalTaskView from '@/components/PersonalTaskView'
import PersonalTaskMobileView from '@/components/PersonalTaskMobileView'
import StaffSelector from '@/components/StaffSelector'
import WorkHistoryView from '@/components/WorkHistoryView'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'history'>('tasks')

  const { selectedDate, setSelectedDate, getSelectedStaffNames } = useTaskStore()
  const { tasks, getTaskStats } = useTasks(selectedDate)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 769)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const selectedStaffNames = getSelectedStaffNames()
  const stats = getTaskStats()
  
  // 総稼働時間を計算
  const totalWorkingHours = calculateWorkingHours(tasks)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-4 lg:py-8">
        {/* ヘッダー */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">
              日次タスク管理システム
            </h1>
            <p className="text-slate-600 text-sm lg:text-base">
              ようこそ、{user.email}さん
            </p>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'tasks' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:border-blue-500"
              />
            )}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            >
              ログアウト
            </button>
          </div>
        </header>

        {/* タブナビゲーション */}
        <div className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 p-1 shadow-md inline-flex">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tasks'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                今日のタスク
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                稼働履歴
              </div>
            </button>
          </div>
        </div>

        {/* メインコンテンツ */}
        {activeTab === 'history' ? (
          <WorkHistoryView />
        ) : (
          isMobile ? (
          /* モバイルレイアウト - 個人用タスクビュー */
          <div className="space-y-6">
            {/* 日付とタイトル */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 p-4 shadow-md">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-800">
                  {formatDisplayDate(selectedDate)}のタスク
                </h2>
                <div className="text-right">
                  <div className="text-sm text-blue-600 font-medium">
                    {formatWorkingHours(calculateWorkingHours(tasks.filter(t => 
                      t.staff_name === (user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'demo') ||
                      t.created_by === user?.id
                    )))}
                  </div>
                  <div className="text-xs text-gray-500">稼働時間</div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                📱 モバイル版では個人のタスクのみ表示されます
              </p>
            </div>

            {/* 個人タスクビュー（モバイル専用） */}
            <PersonalTaskMobileView />
          </div>
        ) : (
          /* デスクトップレイアウト */
          <div className="space-y-6">
            {/* トップバー - 出勤者選択と統計情報 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 出勤者選択 */}
              <StaffSelector />

              {/* 統計情報 */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">今日の統計</h3>
                
                {/* 主要指標 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">出勤者数</div>
                    <div className="text-lg font-semibold text-gray-800">{selectedStaffNames.length}名</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">総タスク数</div>
                    <div className="text-lg font-semibold text-gray-800">{stats.total}件</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">完了率</div>
                    <div className="text-lg font-semibold text-green-600">{stats.completionRate}%</div>
                    <div className="text-xs text-gray-500">({stats.completed}/{stats.total}件完了)</div>
                  </div>
                </div>

                {/* タスク状況の詳細 */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
                  <div className="text-center p-2 bg-gray-100 rounded">
                    <div className="text-gray-600 mb-1">未着手</div>
                    <div className="font-semibold text-gray-700">{stats.notStarted}</div>
                  </div>
                  <div className="text-center p-2 bg-orange-100 rounded">
                    <div className="text-orange-600 mb-1">進行中</div>
                    <div className="font-semibold text-orange-700">{stats.inProgress}</div>
                  </div>
                  <div className="text-center p-2 bg-green-100 rounded">
                    <div className="text-green-600 mb-1">完了</div>
                    <div className="font-semibold text-green-700">{stats.completed}</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-100 rounded">
                    <div className="text-yellow-600 mb-1">保留</div>
                    <div className="font-semibold text-yellow-700">{stats.pending}</div>
                  </div>
                </div>

                {/* 進捗バー */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>進捗状況</span>
                    <span>{stats.completed + stats.inProgress} / {stats.total} 件着手済み</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="h-full flex">
                      {/* 完了済み */}
                      <div 
                        className="bg-green-500 transition-all duration-300"
                        style={{ width: `${(stats.completed / Math.max(stats.total, 1)) * 100}%` }}
                      />
                      {/* 進行中 */}
                      <div 
                        className="bg-orange-400 transition-all duration-300"
                        style={{ width: `${(stats.inProgress / Math.max(stats.total, 1)) * 100}%` }}
                      />
                      {/* 保留 */}
                      <div 
                        className="bg-yellow-400 transition-all duration-300"
                        style={{ width: `${(stats.pending / Math.max(stats.total, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 稼働時間セクション */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-gray-700 text-sm font-medium">総稼働時間</span>
                  </div>
                  <span className="text-blue-600 font-semibold">
                    {formatWorkingHours(totalWorkingHours)}
                  </span>
                </div>
              </div>
            </div>

            {/* メインのタスクテーブルエリア */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">
                {formatDisplayDate(selectedDate)}のタスク
              </h2>
              <TaskTable />
            </div>
          </div>
          )
        )}
      </div>
    </div>
  )
}